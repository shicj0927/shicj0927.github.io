void update(int p,const int v,const int n){
    for(tr[p]+=v; (p+=p&(-p))<=n; tr[p]+=v);
}
int query(int p,int res=0){
    for(res+=tr[p]; (p&=p-1); res+=tr[p]);
    return res;
}
