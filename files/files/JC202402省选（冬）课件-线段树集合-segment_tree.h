//#define validator1 1
#ifndef TEMPLATES__DATA_STRUCTURES__SEGMENT_TREE__SEGMENT_TREE__H
#define TEMPLATES__DATA_STRUCTURES__SEGMENT_TREE__SEGMENT_TREE__H
#include <algorithm>
namespace data_structures{
	using std::min;
	using std::max;
	#define cs const
	#define st static
	#define il __inline__ __attribute__((always_inline))
	#define il_auto inline
	#define tpl template
	#define tpn typename
	typedef unsigned size_t;
	typedef cs size_t cst;
	tpl<tpn T_node,size_t max_n=size_t(-1)>struct segment_tree{
		T_node tr[max_n<<1];
		void build(cst&now,cst&lft,cst&rgt){
			if(lft==rgt){
				tr[now].init(lft);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			build(lsn,lft,mid),build(lsn|1,mid+1,rgt);
			tr[now].init_pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		il void build(cst n){
			build(1,1,n);
		}
		tpl<tpn T_tg>void update_position(cst&now,cst&lft,cst&rgt,cst&pos,cs T_tg&tg){
			if(lft==rgt){
				tr[now].pushtag(lft,tg);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			if(pos<=mid)
				update_position(lsn,lft,mid,pos,tg);
			else
				update_position(lsn|1,mid+1,rgt,pos,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>il void update_position(cst n,cst pos,cs T_tg tg){
#if validator1
			if(1<=pos&&pos<=n)
#endif
				update_position(1,1,n,pos,tg);
		}
		tpl<tpn T_tg>void update_range(cst&now,cst&lft,cst&rgt,cst&l,cst&r,cs T_tg&tg){
			if(l<=lft&&rgt<=r){
				tr[now].pushtag(lft,rgt,tg);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			if(l<=mid)
				update_range(lsn,lft,mid,l,r,tg);
			if(mid<r)
				update_range(lsn|1,mid+1,rgt,l,r,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>il void update_range(cst n,cst l,cst r,cs T_tg tg){
#if validator1
			if(l<=r)
				update_range(1,1,n,max<cst>(1,l),min(n,r),tg);
#else
			update_range(1,1,n,l,r,tg);
#endif
		}
		tpl<tpn T_tg>void update_range_ex_dfs(cst&now,cst&lft,cst&rgt,cs T_tg&tg){
			if(tr[now].pushtag(lft,rgt,tg))
				return;
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			update_range_ex_dfs(lsn,lft,mid,tg),update_range_ex_dfs(lsn|1,mid+1,rgt,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>void update_range_ex(cst&now,cst&lft,cst&rgt,cst&l,cst&r,cs T_tg&tg){
			if(l<=lft&&rgt<=r){
				update_range_ex_dfs(now,lft,rgt,tg);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			if(l<=mid)
				update_range_ex(lsn,lft,mid,l,r,tg);
			if(mid<r)
				update_range_ex(lsn|1,mid+1,rgt,l,r,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>il void update_range_ex(cst n,cst l,cst r,cs T_tg tg){
#if validator1
			if(l<=r)
				update_range_ex(1,1,n,max<cst>(1,l),min(n,r),tg);
#else
			update_range_ex(1,1,n,l,r,tg);
#endif
		}
		tpl<tpn T_val>T_val query_position(cst&now,cst&lft,cst&rgt,cst&pos){
			if(lft==rgt)
				return tr[now].tpl query_position<T_val>(lft);
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			return pos<=mid?query_position<T_val>(lsn,lft,mid,pos):query_position<T_val>(lsn|1,mid+1,rgt,pos);
		}
		tpl<tpn T_val>il T_val query_position(cst n,cst pos){
#if validator1
			if(1<=pos&&pos<=n)
#endif
				return query_position<T_val>(1,1,n,pos);
#if validator1
			return 0;
#endif
		}
		tpl<tpn T_val>T_val query_range(cst&now,cst&lft,cst&rgt,cst&l,cst&r){
			if(l<=lft&&rgt<=r)
				return tr[now].tpl query_range<T_val>(lft,rgt);
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			return l<=mid?(mid<r?T_val::merge(query_range<T_val>(lsn,lft,mid,l,r),query_range<T_val>(lsn|1,mid+1,rgt,l,r)):query_range<T_val>(lsn,lft,mid,l,r)):query_range<T_val>(lsn|1,mid+1,rgt,l,r);
		}
		tpl<tpn T_val>il T_val query_range(cst n,cst l,cst r){
#if validator1
			return l<=r?query_range<T_val>(1,1,n,max<cst>(1,l),min(n,r)):0;
#else
			return query_range<T_val>(1,1,n,l,r);
#endif
		}
	};
	tpl<tpn T_node>struct segment_tree<T_node,size_t(-1)>{
		T_node*tr;
		il segment_tree(cst&n=0):tr(new T_node[n*2]){}
		il ~segment_tree(){
			delete[]tr;
		}
		il void construct(cst&n=0){
			tr=new T_node[n*2];
		}
		il void destruct(){
			delete[]tr;
		}
		il void rebuild(cst&n=0){
			destruct();
			construct(n);
		}
		void build(cst&now,cst&lft,cst&rgt){
			if(lft==rgt){
				tr[now].init(lft);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			build(lsn,lft,mid),build(lsn|1,mid+1,rgt);
			tr[now].init_pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		il void build(cst n){
			build(1,1,n);
		}
		tpl<tpn T_tg>void update_position(cst&now,cst&lft,cst&rgt,cst&pos,cs T_tg&tg){
			if(lft==rgt){
				tr[now].pushtag(lft,tg);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			if(pos<=mid)
				update_position(lsn,lft,mid,pos,tg);
			else
				update_position(lsn|1,mid+1,rgt,pos,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>il void update_position(cst n,cst pos,cs T_tg tg){
#if validator1
			if(1<=pos&&pos<=n)
#endif
				update_position(1,1,n,pos,tg);
		}
		tpl<tpn T_tg>void update_range(cst&now,cst&lft,cst&rgt,cst&l,cst&r,cs T_tg&tg){
			if(l<=lft&&rgt<=r){
				tr[now].pushtag(lft,rgt,tg);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			if(l<=mid)
				update_range(lsn,lft,mid,l,r,tg);
			if(mid<r)
				update_range(lsn|1,mid+1,rgt,l,r,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>il void update_range(cst n,cst l,cst r,cs T_tg tg){
#if validator1
			if(l<=r)
				update_range(1,1,n,max<cst>(1,l),min(n,r),tg);
#else
			update_range(1,1,n,l,r,tg);
#endif
		}
		tpl<tpn T_tg>void update_range_ex_dfs(cst&now,cst&lft,cst&rgt,cs T_tg&tg){
			if(tr[now].pushtag(lft,rgt,tg))
				return;
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			update_range_ex_dfs(lsn,lft,mid,tg),update_range_ex_dfs(lsn|1,mid+1,rgt,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>void update_range_ex(cst&now,cst&lft,cst&rgt,cst&l,cst&r,cs T_tg&tg){
			if(l<=lft&&rgt<=r){
				update_range_ex_dfs(now,lft,rgt,tg);
				return;
			}
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			if(l<=mid)
				update_range_ex(lsn,lft,mid,l,r,tg);
			if(mid<r)
				update_range_ex(lsn|1,mid+1,rgt,l,r,tg);
			tr[now].pushup(tr[lsn],tr[lsn|1],lft,mid,rgt);
		}
		tpl<tpn T_tg>il void update_range_ex(cst n,cst l,cst r,cs T_tg tg){
#if validator1
			if(l<=r)
				update_range_ex(1,1,n,max<cst>(1,l),min(n,r),tg);
#else
			update_range_ex(1,1,n,l,r,tg);
#endif
		}
		tpl<tpn T_val>T_val query_position(cst&now,cst&lft,cst&rgt,cst&pos){
			if(lft==rgt)
				return tr[now].tpl query_position<T_val>(lft);
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			return pos<=mid?query_position<T_val>(lsn,lft,mid,pos):query_position<T_val>(lsn|1,mid+1,rgt,pos);
		}
		tpl<tpn T_val>il T_val query_position(cst n,cst pos){
#if validator1
			if(1<=pos&&pos<=n)
#endif
				return query_position<T_val>(1,1,n,pos);
#if validator1
			return 0;
#endif
		}
		tpl<tpn T_val>T_val query_range(cst&now,cst&lft,cst&rgt,cst&l,cst&r){
			if(l<=lft&&rgt<=r)
				return tr[now].tpl query_range<T_val>(lft,rgt);
			cst mid=(lft+rgt)>>1;
			cst lsn=mid<<1;
			tr[now].pushdown(tr[lsn],tr[lsn|1],lft,mid,rgt);
			return l<=mid?(mid<r?T_val::merge(query_range<T_val>(lsn,lft,mid,l,r),query_range<T_val>(lsn|1,mid+1,rgt,l,r)):query_range<T_val>(lsn,lft,mid,l,r)):query_range<T_val>(lsn|1,mid+1,rgt,l,r);
		}
		tpl<tpn T_val>il T_val query_range(cst n,cst l,cst r){
#if validator1
			return l<=r?query_range<T_val>(1,1,n,max<cst>(1,l),min(n,r)):0;
#else
			return query_range<T_val>(1,1,n,l,r);
#endif
		}
	};
	#undef cs
	#undef st
	#undef il
	#undef il_auto
	#undef tpl
	#undef tpn
}
#endif
