// Conta visitas à página e cliques nos botões e redes (links com data-track), sem atrasar nada.
(function () {
  function send(action, data) {
    try {
      var body = new Blob([JSON.stringify(data)], { type: "application/json" });
      var url = "/api/?a=" + action;
      if (!(navigator.sendBeacon && navigator.sendBeacon(url, body))) {
        fetch(url, { method: "POST", body: body, keepalive: true, credentials: "omit" });
      }
    } catch (e) {
      /* não atrapalha a página */
    }
  }

  // Visita: um código aleatório guardado neste navegador conta a pessoa uma vez só;
  // a visita conta uma vez por aba aberta (recarregar não soma de novo).
  try {
    var v = localStorage.getItem("setup_v");
    if (!v || !/^[a-z0-9]{16,40}$/.test(v)) {
      var bytes = crypto.getRandomValues(new Uint8Array(12));
      v = Array.prototype.map.call(bytes, function (b) { return b.toString(36).padStart(2, "0"); }).join("").slice(0, 24);
      localStorage.setItem("setup_v", v);
    }
    var first = !sessionStorage.getItem("setup_s");
    sessionStorage.setItem("setup_s", "1");
    send("visita", { v: v, s: first });
  } catch (e) {
    /* sem armazenamento (aba anônima bloqueada): não conta */
  }

  document.addEventListener(
    "click",
    function (e) {
      var a = e.target && e.target.closest ? e.target.closest("a[data-track]") : null;
      var id = a && a.getAttribute("data-track");
      if (id) send("clique", { id: id });
    },
    true
  );
})();
