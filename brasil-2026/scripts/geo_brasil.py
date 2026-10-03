import json, math, shapely, shapely.ops, shapely.affinity, numpy as np, sys
from shapely.geometry import shape, Polygon, MultiPolygon
from shapely import coverage_simplify, coverage_union_all
print(shapely.geos_version)
# Albers equal-area conic, Brasil (IBGE): lat0=-12 lon0=-54 lat1=-2 lat2=-22
R=6371.0; p1,p2,p0,l0=map(math.radians,(-2,-22,-12,-54))
n=(math.sin(p1)+math.sin(p2))/2; C=math.cos(p1)**2+2*n*math.sin(p1); r0=math.sqrt(C-2*n*math.sin(p0))/n
def proj(lon,lat):
    lam,phi=math.radians(lon),math.radians(lat)
    r=math.sqrt(C-2*n*math.sin(phi))/n; th=n*(lam-l0)
    return (r*math.sin(th), -(r0-r*math.cos(th)))  # y down
def projgeom(g):
    def ring(cs): return [proj(x,y) for x,y in cs]
    if g.geom_type=='Polygon': return Polygon(ring(g.exterior.coords),[ring(i.coords) for i in g.interiors])
    return MultiPolygon([projgeom(p) for p in g.geoms])
src=json.load(open(sys.argv[1],encoding='utf-8'))
codes=[f['properties']['codarea'] for f in src['features']]
def sin_islas_lejanas(g):
    # Trindade y Martim Vaz (Vitória, ES) y São Pedro e São Paulo quedan a >1000 km de la costa y
    # achican todo el mapa; se omiten del dibujo (los votos siguen contando). Noronha (-32,4) se queda.
    if g.geom_type == 'Polygon':
        return g
    partes = [p for p in g.geoms if p.centroid.x < -32.2]
    return partes[0] if len(partes) == 1 else MultiPolygon(partes)
geoms=[projgeom(sin_islas_lejanas(shape(f['geometry']))) for f in src['features']]
geoms=[g if g.is_valid else g.buffer(0) for g in geoms]
minx=min(g.bounds[0] for g in geoms); miny=min(g.bounds[1] for g in geoms)
maxx=max(g.bounds[2] for g in geoms); maxy=max(g.bounds[3] for g in geoms)
W=1000.0; s=W/(maxx-minx); H=(maxy-miny)*s
print('H',H)
def tosvg(g):
    return shapely.affinity.affine_transform(g,[s,0,0,s,-minx*s,-miny*s])
geoms=[tosvg(g) for g in geoms]
tol=float(sys.argv[2])
simp=list(coverage_simplify(np.array(geoms,dtype=object),tol,simplify_boundary=True))
def enc(g,q=10):
    out=[]
    polys=[g] if g.geom_type=='Polygon' else list(getattr(g,'geoms',[]))
    for p in polys:
        if p.is_empty: continue
        for rg in [p.exterior]+list(p.interiors):
            pts=[(round(x*q),round(y*q)) for x,y in rg.coords[:-1]]
            ded=[pts[0]]
            for pt in pts[1:]:
                if pt!=ded[-1]: ded.append(pt)
            if len(ded)<3: continue
            x0,y0=ded[0]; seg=[f"M{x0/q:g} {y0/q:g}"]; px,py=x0,y0; rel=[]
            for x,y in ded[1:]:
                rel.append(f"{(x-px)/q:g} {(y-py)/q:g}"); px,py=x,y
            out.append(seg[0]+"l"+" ".join(rel).replace(" -","-")+"z")
    return "".join(out)
mun=[{"c":c,"d":enc(g)} for c,g in zip(codes,simp)]
# states: union per UF code prefix
from collections import defaultdict
by=defaultdict(list)
for c,g in zip(codes,simp): by[c[:2]].append(g)
uf=[]
for k,gs in sorted(by.items()):
    u=shapely.union_all(gs,grid_size=0.05)
    uf.append({"c":k,"d":enc(u)})
# centroids (label points) for UF and mun
cent={c:[round(p.x,1),round(p.y,1)] for c,p in ((c,g.representative_point()) for c,g in zip(codes,simp))}
ufc={}
for k,gs in by.items():
    u=shapely.union_all(gs,grid_size=0.05); big=max(u.geoms,key=lambda z:z.area) if u.geom_type=='MultiPolygon' else u
    pl=shapely.ops.polylabel(big,0.5) if hasattr(shapely.ops,'polylabel') else big.representative_point()
    ufc[k]=[round(pl.x,1),round(pl.y,1)]
out={"w":W,"h":round(H,1),"uf":uf,"mun":mun,"ufc":ufc}
js="window.GEO_BR="+json.dumps(out,separators=(',',':'))+";\n"
open(sys.argv[3],'w',encoding='utf-8').write(js)
print('mun bytes',sum(len(m['d']) for m in mun),'uf bytes',sum(len(u['d']) for u in uf),'total',len(js))
