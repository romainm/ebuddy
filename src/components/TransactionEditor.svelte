<script>
    import { transactionFilter } from "../store/cache";
    const ipc = require("electron").ipcRenderer;
    export let transactions = [];

    let category;

    $: if (transactions.length) {
        initValues();
    }

    function initValues() {
        category = transactions.length ? transactions[0].category : "";
        category = category ? category : "";
    }
    function saveChanges() {
        console.log("save changes");
        transactions.forEach(t => {
            t.category = category;
        });

        ipc.send("update_transactions", transactions);
    }
</script>

<style>

</style>

<form class="ui form" on:submit|preventDefault={saveChanges}>
    <div>{transactions.length} transactions selected</div>
    <div class="field">
        <label>Category</label>
        <div class="ui action input">
            <input type="text" bind:value={category} />
            <div class="ui button" on:click={saveChanges}>Save</div>
        </div>
    </div>
</form>
