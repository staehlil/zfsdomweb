import http from "./http-auth";

export default class CrudService {
    constructor(apiName) {
        this.apiName=apiName;
    }
    index(config,spec=null) {
        return http.get(`/${this.apiName}${spec ? `/?${spec}` : ""}`,config);
    }
    userIndex(userId,config,spec=null) {
        return http.get(`/${this.apiName}/${userId}${spec ? `/?${spec}` : ""}`,config);
    }
    sort(data, config) {
        return http.post(`/${this.apiName}/sort`, data, config);
    }

    get(id,config) {
        return http.get(`/${this.apiName}/${id}`,config);
    }

    create(data, config) {
        return http.post(`/${this.apiName}`, data, config);
    }

    update(id, data, config) {
        return http.put(`/${this.apiName}/${id}`, data, config);
    }

    delete(id, config) {
        return http.delete(`/${this.apiName}/${id}`,config);
    }
}
