<script>
    import { formatDate, formatMoney } from "../utils/formatters";
    import { accountLabelById } from "../store/cache";
    import TransactionEditor from "./TransactionEditor.svelte";
    import { onMount } from "svelte";

    export let transactions = [];
    let selectedTransactionIds = [];

    function wrap(ts) {
        return ts.map(t => {
            return {
                ...t,
                selected: selectedTransactionIds.includes(t["$loki"]),
            };
        });
    }

    $: wrappedTransactions = wrap(transactions);
    $: selectedTransactions = wrappedTransactions.filter(t => t.selected);
    // will only work with already recorded transactions
    $: selectedTransactionIds = selectedTransactions.map(t => t["$loki"]);

    let lastSelected = null;

    function onClickRow(e, i) {
        if (e.ctrlKey) {
            wrappedTransactions[i].selected = !wrappedTransactions[i].selected;
        } else if (lastSelected != null && e.shiftKey) {
            const start = Math.min(lastSelected, i);
            const end = Math.max(lastSelected, i) + 1;
            for (let k = start; k < end; k++) {
                wrappedTransactions[k].selected = true;
            }
        } else {
            const newStatus = !wrappedTransactions[i].selected;
            wrappedTransactions.forEach(t => (t.selected = false));
            wrappedTransactions[i].selected = newStatus;
        }
        if (!wrappedTransactions[i].selected) {
            i = null;
        }
        lastSelected = i;
    }
    onMount(() => {
        jQuery(".ui.sticky").sticky({
            context: "#transactions-table",
            observeChanges: true,
        });
    });
</script>

<style>
    .footer {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 50px;
    }
    .invisible {
        visibility: hidden;
    }
</style>

<div class="ui container" id="transactions-table">
    <table class="ui selectable table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Account</th>
                <th>Amount</th>
                <th>Category</th>
                <th data-sortable="true" data-field="name">Name</th>
            </tr>
        </thead>
        <tbody>
            {#each wrappedTransactions as transaction, i}
                <tr
                    class:disabled={transaction.exists}
                    class:active={transaction.selected}
                    on:click={e => onClickRow(e, i)}>
                    <td>{formatDate(transaction.date)}</td>
                    <td>{$accountLabelById[transaction.accountId]}</td>
                    <td class="right aligned">
                        {formatMoney(transaction.amount)}
                    </td>
                    <td>{transaction.category ? transaction.category : ''}</td>
                    <td>{transaction.name}</td>
                </tr>
            {/each}
        </tbody>
    </table>
    <div
        class="ui right very close rail"
        class:invisible={lastSelected === null}>
        <div class="ui sticky">
            <TransactionEditor transactions={selectedTransactions} />
        </div>

    </div>
</div>
