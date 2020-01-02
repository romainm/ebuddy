<script>
    const ipc = require("electron").ipcRenderer;

    export let account = null;

    let accountLabel;
    let accountInitialBalance;
    let accountInitialBalanceDate;

    $: if (account != null) {
        initValues();
    }

    function initValues() {
        accountLabel = account.label ? account.label : "";
        accountInitialBalance = account.initialBalance
            ? account.initialBalance
            : 0;
        accountInitialBalanceDate = moment().format("YYYY-MM-DD");

        if (account.initialBalanceDate) {
            accountInitialBalanceDate = moment(
                account.initialBalanceDate
            ).format("YYYY-MM-DD");
        }
    }

    function saveChanges() {
        const updatedAccount = {
            ...account,
            label: accountLabel,
        };
        if (isValidBalance(accountInitialBalance)) {
            updatedAccount.initialBalance = parseFloat(accountInitialBalance);
            updatedAccount.initialBalanceDate = convertToDate(
                accountInitialBalanceDate
            );
        }
        ipc.send("update_account", updatedAccount);
        account = null;
    }

    function discardChanges() {
        account = null;
    }

    function isValidBalance(balance) {
        const test = +balance;
        return !isNaN(test);
    }

    function convertToDate(date) {
        const d = moment(date, "YYYY-MM-DD");
        if (!d.isValid()) {
            return new Date();
        }
        return d.toDate();
    }

    $: if (account != null) {
        jQuery(".ui.modal").modal("show");
    }
</script>

<style>

</style>

<div class="ui modal">
    <div class="header">Account {account ? account.id : ''}</div>
    <div class="content">
        <form class="ui form">
            <div class="field">
                <label>Label</label>
                <input
                    type="text"
                    name="label"
                    placeholder="label"
                    bind:value={accountLabel} />
            </div>
            <div class="field">
                <label>Balance</label>
                <div class="ui left labeled input">
                    <label for="balance" class="ui label">$</label>
                    <input
                        type="text"
                        name="balance"
                        placeholder="balance"
                        bind:value={accountInitialBalance} />
                </div>
            </div>
            <div class="field">
                <label>Balance Date</label>
                <div class="ui calendar" id="balanceDateCalendar">
                    <div class="ui input left icon">
                        <i class="calendar icon" />
                        <input
                            type="date"
                            placeholder="Date"
                            bind:value={accountInitialBalanceDate} />
                    </div>
                </div>
            </div>
        </form>
    </div>
    <div class="actions">
        <button class="ui black deny button" on:click={discardChanges}>
            Cancel
        </button>
        <button
            class="ui positive right labeled icon button"
            on:click={saveChanges}>
            Save Changes
            <i class="checkmark icon" />
        </button>
    </div>
</div>
