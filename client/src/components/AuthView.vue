<script>
import {singletons} from "../../shared";
import {io} from "socket.io-client";

export default {
  name: "AuthView",
  data() {
    return {
      deferred:null
    }
  },
  async created() {
    this.deferred = new Promise((resolve)=>{
      this.authService.ensureAuth(this.requiredUserLevel||false)
      .then(isAuth=>{
        let root = import.meta.env?.VUE_APP_CLUSTER_ROOT || false;
        if (root!==false) {
          let nodes = (import.meta.env?.VUE_APP_CLUSTER_NODES||"").split(",").map(item=>item.trim());
          singletons.cluster = {
            root,
            nodes,
            node:(nodes.find(node=>node===isAuth.node)) ? isAuth.node : (nodes.length ? nodes[0] : "m01")
          }
        }

        if (!isAuth)
          this.$router.push(`/login/?q=${location.pathname}`);
        else {
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
        this.$toast.add({severity:'error', summary: err.messageTitle||'Fehler', detail:err.message||err, life: 3000})
        if (err.code!==403)
          this.$router.push("/login");
        else
          this.$router.back()
        resolve(false);
      });
    });
  }
};
</script>