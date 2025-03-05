import http from "./http-common";
import {singletons} from "../shared";
import {HttpAuth} from "@/http-auth";

class HttpAuthAutoNode extends HttpAuth {
  getApiUrl(url,part) {
    if (!part)
      return super.getApiUrl(url);
    let {root,nodes} = singletons.cluster;
    let node = part[0]?.node || (nodes?.length ? nodes[0] : "m01");
    return root ? `${location.protocol}//${node}.${root}/api${url}` : url
  }
  partition(data) {
    let map = {};
    let {nodes} = singletons.cluster;
    let node = nodes?.length ? nodes[0] : "m01";
    for (let item of data) {
      let part = item.node || node;
      map[part] = map[part] || [];
      map[part].push(item);
    }
    let parts = [];
    for (let part in map) {
      parts.push(map[part]);
    }
    return parts;
  }
  async post(url,data,config) {
    return await this.authService.ensure(async (localAuth)=>{
      return Promise.all(this.partition(data).map(async part=>{
        return await http.post(this.getApiUrl(url,part),part,{
          ...config||{},
          headers:{
            ...(config||{}).headers||{},
            'Authorization' : 'Bearer '+localAuth.accessToken
          }
        })
      }));
    });
  }
}
export default new HttpAuthAutoNode();