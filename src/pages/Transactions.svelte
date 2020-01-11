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

    // $: console.log(chartData);

    function updateTransactions(ft) {
        ipc.send("list_transactions", $transactionFilter);
    }
    $: updateTransactions($transactionFilter);

    // event slots
    ipc.on("transactions", (event, docs) => {
        // convert back date to Date object
        transactions = docs.map(doc => {
            return { ...doc, date: new Date(doc.date) };
        });
        updateChart();
    });

    ipc.on("transactions_updated", (event, messages) => {
        ipc.send("list_transactions", $transactionFilter);
    });

    function updateChart() {
        // group transactions per month
        const maxMonths = 12;
        const totalPerMonth = Array(maxMonths).fill(0);
        const today = new Date();
        const currentMonth = today.getMonth();
        const currentYear = today.getYear();
        for (let i = 0; i < transactions.length; i++) {
            const amount = transactions[i].amount;
            const date = transactions[i].date;

            var nbMonths = currentMonth - date.getMonth();
            var nbYears = currentYear - date.getYear();
            nbMonths += nbYears * 12;

            if (nbMonths >= maxMonths) {
                continue;
            }

            totalPerMonth[nbMonths] += amount;
        }

        var min = Math.min(...totalPerMonth);
        var max = Math.max(...totalPerMonth);

        // build list of months
        let month;
        let chartData_ = [];
        let date = today;
        for (let i = 0; i < maxMonths; i++) {
            month = moment(date).format("MMM YYYY");
            chartData_.unshift({ value: totalPerMonth[i], label: month });
            date.setMonth(date.getMonth() - 1);
        }

        chartData = chartData_;
    }

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
