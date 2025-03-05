import http from "./http-common";
import httpAuth from "./http-auth";

export default class AuthService {
    simpleFingerprint;
    constructor() {
        this.simpleFingerprint = this.generateSimpleFingerprint();
    }
    async login(args, config) {
      let { data } = await http.post(`/auth/login`, {...args,fingerprint:this.simpleFingerprint}, config);
      return this.setLocalAuth(data)
    }
    async extlogin(args, config) {
      let { data } = await http.post(`/auth/extlogin`, {...args,fingerprint:this.simpleFingerprint}, config);
      return this.setLocalAuth(data)
    }
    async oidcLogin(args, config) {
        let { data } = await http.post(`/auth/oidclogin`, {...args,fingerprint:this.simpleFingerprint}, config);
        if (!data.error)
          return this.setLocalAuth(data);
        else
          throw(data.error);
    }
    async register(args, config) {
        let { data } = await http.post(`/auth/register`, {...args,fingerprint:this.simpleFingerprint}, config);
        return this.setLocalAuth(data)
    }
    async getProfile(config) {
      let { data } = await http.get(`/auth/profile`, config);
      return this.setLocalProfile(data);
    }
    async refresh(config) {
      let { data } = await http.get(`/auth/refresh/${this.simpleFingerprint}`, config);
      return this.setLocalAuth(data)
    }
    async reset({email,url}, config) {
      return (await http.post(`/auth/reset`, { email,url }, config)).data||{};
    }
    async uuid(uuid, config) {
        return (await http.get(`/auth/reset/${uuid}`, config)).data||{};
    }
    async change({uuid,pass}, config) {
        return (await http.post(`/auth/reset/${uuid}`, { pass }, config)).data||{};
    }
    async requestConfirm({email, url}, config) {
        return (await http.post(`/auth/confirm`, { email, url }, config)).data||{};
    }
    async confirm(uuid, config) {
        return (await httpAuth.get(`/auth/confirm/${uuid}`, config)).data||{};
    }
    setLocal(key,data) {
      localStorage.setItem(key,JSON.stringify(data || null));
      return data;
    }
    getLocal(key) {
      let data = null;
      try {
        data = JSON.parse(localStorage.getItem(key));
      } catch (err) {
        data = null;
      }
      return data;
    }
    purgeLocal(key) {
      this.setLocal(key,null);
    }
    setLocalAuth(data) {
      return this.setLocal("auth",data);
    }
    getLocalAuth() {
      return this.getLocal("auth");
    }
    purgeLocalAuth() {
      this.purgeLocal("auth");
    }
    setLocalProfile(data) {
       this.setLocal("profile",data);
       dispatchEvent(new CustomEvent('auth-change', {}));
       return data;
    }
    getLocalProfile() {
      return this.getLocal("profile");
    }
    purgeLocalProfile() {
      this.purgeLocal("profile");
      dispatchEvent(new CustomEvent('auth-change', null));
    }
    async ensure(f) {
      let localAuth = this.getLocalAuth();
      // if there is no accessToken present, return
      if (!localAuth)
        return false;
      //console.log("> local accessToken present")
      let data = null, retry = 0, error=false;
      while (retry++<2) {
        try {
          data = await f.call(this,localAuth);
          retry++;
          //console.log("> accessToken is valid", data);
        } catch (err) {
          error = err;

          // if this isn't an auth error [http 40x], don't retry
          if (!`${(err.response?.status||"")}`.match(/^40[13]/))
            retry++;
          else {
            // if the local accessToken is invalid, try refreshing it (once)
            //console.log("> accessToken invalid");
            try {
              localAuth = await this.refresh({
                headers:{
                  'Authorization' : 'Bearer '+localAuth.refreshToken,
                }
              });
              this.setLocalAuth(localAuth)
              //console.log("> token refresh successful")
            } catch (err) {
              // if the refreshToken isn't valid, stop trying
              //console.log("> token refresh failed")
              this.purgeLocalAuth();
              retry++;
            }
          }
        }
      }
      // if the endpoint threw a terminal error, rethrow it
      if (data===null && error!==false) {
        throw error;
      }
      return data;
    }
    async ensureAuth(userlevel=false){
      let profile = await this.ensure( async (localAuth)=>{
        let profile = await this.getProfile({
          headers:{
            'Authorization' : 'Bearer '+localAuth.accessToken,
          }
        });
        if (userlevel!==false && (profile.level||-1)<userlevel)
          throw({message:"your userlevel is insufficient",messageTitle:"Unauthorized",code:403});
        return profile;
      });
      if (!profile)
          this.purgeLocalProfile();
      return profile;
    }
    async logout() {
        await this.ensure( async (localAuth)=>{
            await http.post(`/auth/logout`, {fingerprint:this.simpleFingerprint}, {
                headers:{
                    'Authorization' : 'Bearer '+localAuth.accessToken,
                }
            });
            /* todo: oidclogout if this user is logged in through oidc
            window.location.href=`/api/auth/oidclogout` */
        });
        this.purgeLocalAuth();
        this.purgeLocalProfile();
    }
    async createGuestUser(config) {
        let {data} = await http.post(`/public/auth/guest`, {}, config);
        return this.setLocalAuth(data);
    }
    generateSimpleFingerprint() {
        const userAgent = navigator.userAgent;
        const screenResolution = `${screen.width}x${screen.height}`;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const languages = navigator.languages.join(', ');
        return btoa(`${userAgent}|${screenResolution}|${timeZone}|${languages}`);
    }
}
