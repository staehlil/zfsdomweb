import http from "@/http-auth";

class AccountService {
    constructor(apiName) {
        this.apiName=apiName;
    }
    getStats(config) {
        return http.get(`/${this.apiName}/stats`,config);
    }
}
export default new AccountService("account");