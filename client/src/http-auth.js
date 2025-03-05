import http from "./http-common";
import AuthService from "@/auth-service";
import {singletons} from "../shared";

export class HttpAuth {
  authService;
  constructor() {
    this.authService = new AuthService();
  }
  getApiUrl(url) {
    let {root,node} = singletons.cluster
    return root ? `${location.protocol}//${node}.${root}/api${url}` : url
  }
  async get(url,config){
    return await this.authService.ensure(async (localAuth) => {
      return await http.get(this.getApiUrl(url),{
        headers:{
          'Authorization' : 'Bearer '+localAuth.accessToken,
        },
        ...config||{}})
      }
    );
  }
  async post(url,data,config) {
    return await this.authService.ensure(async (localAuth)=>{
      return await http.post(this.getApiUrl(url),data,{
        ...config||{},
        headers:{
          ...(config||{}).headers||{},
          'Authorization' : 'Bearer '+localAuth.accessToken
        }
      })
    });
  }
  async put(url,data,config) {
    return await this.authService.ensure(async (localAuth)=>{
      return await http.put(this.getApiUrl(url),data,{
        headers:{
          'Authorization' : 'Bearer '+localAuth.accessToken,
        },
        ...config||{}});
    });
  }
  async delete(url,config) {
    return await this.authService.ensure(async (localAuth)=>{
      return await http.delete(this.getApiUrl(url),{
      headers:{
        'Authorization' : 'Bearer '+localAuth.accessToken,
      },
      ...config||{}});
    });
  }
}
export default new HttpAuth();