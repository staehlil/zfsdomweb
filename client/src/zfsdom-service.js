import http from "./http-auth";

class ZfsdomService {
  constructor(apiName="zfsdom") {
    this.apiName=apiName;
  }
  async getDomains(host) {
    return (await http.get(`/${this.apiName}/domains/${host}`)).data||[];
  }
  async run(action, srcHost, domains, destHost=null, dryRun=false, force=false) {
    return (await http.post(`/${this.apiName}/run`,{action, srcHost, domains, destHost, dryRun, force})).data||{};
  }
  async abort(uuid) {
    return (await http.get(`/${this.apiName}/abort/${uuid}`)).data||{};
  }
  async all() {
    return (await http.get(`/${this.apiName}/all`)).data||{};
  }
}
export default new ZfsdomService();
