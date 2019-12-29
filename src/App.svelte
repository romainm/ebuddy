<script>
  import Nav from "./components/Nav.svelte";
  import Router from "svelte-spa-router";
  import Transactions from "./pages/Transactions.svelte";
  import Import from "./pages/Import.svelte";

  import moment from "moment";
  window.moment = moment;
  console.log(jQuery)

  let segment;

  const routes = {
    "/": Transactions,
    "/transactions": Transactions,
    "/import": Import
  };
</script>

<style>

</style>

<div id="app">
  <Nav {segment} />
  <Router {routes} />

</div>
