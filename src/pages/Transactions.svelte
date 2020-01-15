<script>
    import AccountEditor from "../components/AccountEditor.svelte";
    import TransactionSearch from "../components/TransactionSearch.svelte";
    import TransactionTable from "../components/TransactionTable.svelte";
    import Chart from "../components/Chart.svelte";
    import { accounts, transactionFilter } from "../store/cache";
    const ipc = require("electron").ipcRenderer;
    import Icon from "svelte-awesome";
    import { beer } from "svelte-awesome/icons";
    import { faEdit } from "@fortawesome/free-regular-svg-icons";
    import { formatMoney } from "../utils/formatters";

    // variables
    let transactions = [];
    let selectedAccount = null;
    let editedAccount = null;
    let chartData = [];

    function onFilterChanged(ft) {
        ipc.send("list_transactions", $transactionFilter);
        ipc.send("build_quick_chart", { filter: $transactionFilter });
    }
    $: onFilterChanged($transactionFilter);

    // event slots
    ipc.on("transactions", (event, docs) => {
        // convert back date to Date object
        transactions = docs.map(doc => {
            return { ...doc, date: new Date(doc.date) };
        });
    });

    ipc.on("quick_chart_built", (event, args) => {
        chartData = args;
    });

    ipc.on("transactions_updated", (event, messages) => {
        ipc.send("list_transactions", $transactionFilter);
        ipc.send("build_quick_chart", { filter: $transactionFilter });
    });

    const openAccountWindow = account => {
        editedAccount = account;
    };

    function onSelectAccount(account) {
        const accountId =
            $transactionFilter.accountId === account.id ? null : account.id;
        selectedAccount =
            $transactionFilter.accountId === account.id ? null : account;
        transactionFilter.update(f => {
            f.accountId = accountId;
            return f;
        });
    }
</script>

<style>
    button.selected {
        border: 4px;
    }
    .account-button {
        background-color: #d1d1d1;
        border-radius: 5px;
        padding: 5px 10px;
    }
    .selected-account {
        background-color: #999999;
        border-style: solid;
        border-width: 2px;
        border-color: #555555;
    }
</style>

<div class="ui container grid">
    <Chart data={chartData} width="6" />
    <div class=" sixteen wide column">
        {#each $accounts as account}
            <div
                class="ui right big icon label"
                class:active={selectedAccount === account}
                on:click={() => onSelectAccount(account)}>
                {account.label ? account.label : account.id}
                <div class="detail">
                    {account.balance ? '$' + formatMoney(account.balance) : ''}
                </div>
                <i
                    class="edit icon"
                    on:click={() => openAccountWindow(account)} />
            </div>
        {/each}
    </div>
    <div class=" sixteen wide column">
        <TransactionSearch />
    </div>
    <div class="row">
        <TransactionTable {transactions} />
    </div>
</div>

<AccountEditor account={editedAccount} />
