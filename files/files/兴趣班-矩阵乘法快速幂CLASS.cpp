class Matrix {
		int dat[101][101];
		int size;
	public:
		Matrix(int size_=0) {
			memset(dat,0,sizeof(dat));
			size=size_;
		}
		void set_init(){
			for(int i=1;i<=size;i++)
					dat[i][i]=1;
		}
		void set(int x,int y,int v) {
			dat[x][y]=v;
		}
		int get(int x,int y) {
			return dat[x][y]%MOD;
		}
		friend Matrix operator * (Matrix &a_,Matrix &b_){
			a_.DEBUG("a_");
			b_.DEBUG("b_");
			Matrix ans_(a_.size);
			for(int i=1; i<=a_.size; i++) {
				for(int j=1; j<=a_.size; j++) {
					for(int k=1; k<=a_.size; k++) {
						ans_.dat[i][j]+=a_.dat[i][k]*b_.dat[k][j]%MOD;
						ans_.dat[i][j]%=MOD;
					}
				}
			}
			ans_.DEBUG("ans_");
			return ans_;
		}
		friend Matrix operator ^ (Matrix n_,int k_){
			if(k_==1)return n_;
			n_.DEBUG("^");
			Matrix ans_(n_.size);
			ans_.set_init();
			while(k_) {
				if(k_&1)
					ans_=ans_*n_;
				n_=n_*n_;
				k_>>=1;
			}
			return ans_;
		}
		void DEBUG(string out="Matrix Debug"){
			if(!DEBUG_FLAG)return;
			else{
				std::cout<<out<<std::endl;
				std::cout<<"    size="<<size<<std::endl;
				std::cout<<"    dat="<<std::endl;
				for(int i=1;i<=size;i++){
					cout<<"    ";
					for(int j=1;j<=size;j++){
						std::cout<<dat[i][j]<<" ";
					}
					std::cout<<std::endl;
				}
			}
		}
};
