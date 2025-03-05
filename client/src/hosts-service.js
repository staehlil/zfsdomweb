import http from "./http-auth";

class HostsService {
  constructor(apiName="hosts") {
    this.apiName=apiName;
  }
  async getHosts() {
    return (await http.get(`/${this.apiName}`)).data||[];
  }
}
export default new HostsService();
