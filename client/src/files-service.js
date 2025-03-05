import http from "./http-auth";

class FilesService {
  constructor(apiName="files") {
    this.apiName=apiName;
  }
  index(key="") {
    return http.get(`/${this.apiName}/${key}`);
  }
  ownIndex(mapPln) {
    const urlbase64json = btoa(encodeURIComponent(JSON.stringify(mapPln).replace(/\//g,"-")));
    return http.get(`/${this.apiName}/own/${urlbase64json}`);
  }
  get(key,file) {
    return http.get(`/${this.apiName}/${key}/${file}`,{responseType:"blob"});
  }
  getOwn(label,dir,file,pln) {
    const urlbase64json = btoa(encodeURIComponent(JSON.stringify({label,dir,file,pln}).replace(/\//g,"-")));
    return http.get(`/${this.apiName}/own-download/${urlbase64json}`,{responseType:"blob"});
  }
  delete(key,file) {
    return http.delete(`/${this.apiName}/${key}/${file}`);
  }
  upload(record,files) {
    let formData = new FormData();
    formData.append("record",record);
    files.forEach(file=>{
      formData.append("files",file,encodeURIComponent(file.name))
    });
    return http.post(`/${this.apiName}/upload`,formData,{
      headers: {
        "Content-Type": "multipart/form-data",
      }
    });
  }
}
export default new FilesService();
