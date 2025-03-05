import CrudService from "./crud-service";
import http from "@/http-auth";

class MailService extends CrudService {
  test(to, config) {
    return http.get(`/${this.apiName}/test/${to}`, config);
  }
  send({ to,html,subject }, config) {
    return http.post(`/${this.apiName}/send`, {to,html,subject}, config);
  }
}
export default new MailService("mail");