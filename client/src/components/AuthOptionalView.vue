<script>
import {singletons} from "../../shared";
import {io} from "socket.io-client";

export default {
  name: "AuthOptionalView",
  data() {
    return {
      deferred:null
    }
  },
  async created() {
    this.deferred = new Promise((resolve)=>{
      this.authService.ensureAuth(this.requiredUserLevel||false)
      .then(isAuth=>{
        let root = false;
        if (isAuth) {
          singletons.profile = isAuth;
          let { expired, confirmation } = isAuth;
          if (!confirmation)
            this.$router.push("/confirmation");
          else if (expired)
            this.$router.push("/password-expired");
          else {
            let primaryNode = isAuth.node || "m01";
            let usedNodes = root!==false ? (isAuth.usedNodes || "").split(",").map(n => n.trim()).filter(n=>n) : [];
            if (!usedNodes.find(n=>n===primaryNode))
              usedNodes.push(primaryNode);
            let {accessToken:token} = this.authService.getLocalAuth() || {};
            if (token) {
              for (let node of usedNodes) {
                if (!singletons.sockets[node]) {
                  let {root} = singletons.cluster;
                  singletons.sockets[node] = io(root ? `${location.protocol}//${node}.${root}` : location.origin, {
                    query:{
                      token
                    }
                  });
                }
              }
            }
          }
        }
        resolve(isAuth);
      })
      .catch(err => {
        console.log(err);
        resolve(false);
      });
    });
  }
};
</script>