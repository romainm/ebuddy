<script>
    import { transactionFilter } from "../store/cache"

    let searchText = $transactionFilter.text ? $transactionFilter.text : ""

    function updateTransactionFilter(text) {
        transactionFilter.update(f => {
            f.text = searchText
            return f
        })
    }

    $: updateTransactionFilter(searchText)
</script>

<div class="ui fluid input focus">
    <input
        plaintext
        placeholder="Search for transactions / category"
        type="search"
        name="search"
        id="exampleSearch"
        bind:value={searchText}
        readonly={false} />
</div>
