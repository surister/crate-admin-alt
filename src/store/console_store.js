import {defineStore} from "pinia";
import {computed, reactive, toRefs, watch} from "vue";
import {request_crate} from "@/store/http/requests";

import Queries from "@/store/http/queries";

import {format_sql} from "@/store/utils";
import {useRoute, useRouter} from "vue-router";


const default_console_response = {
    type: '',
    title: '',
    subtitle: '',
    error_trace: '',
    data: {
        headers: [],
        rows: [],
    }
}

export const use_console_store = defineStore('console', () => {
    const state = reactive({
        consoles: [
            {content: '', name: 'default'}
        ],
        current_console_index: 0,
        response: {...default_console_response}, // The response from querying to CrateDB
        is_query_running: false,
        add_query_to_history: true,
        live_update: false,
        _live_update_interval: null,
        show_full_screen_response: false,
        object_representation_mode: true,
        history_drawer: true,
    })
    const current_console = computed(() => {
        if (state.current_console_index >= state.consoles.length){
            state.current_console_index -=1
        }
        return state.consoles[state.current_console_index]
    })
    const router = useRouter()
    const route = useRoute()

    async function format_query_content() {
        current_console.value.content = format_sql(current_console.value.content)
    }

    async function set_console_response_to_error(type, title, subtitle, error_trace) {
        state.response.type = type
        state.response.title = title
        state.response.subtitle = subtitle
        state.response.error_trace = error_trace
    }

    async function set_console_response_to_success(type, title, subtitle, rows, headers, row_count) {
        state.response.type = 'success'
        state.response.title = 'Success'
        state.response.subtitle = subtitle
        state.response.data.rows = rows
        state.response.data.headers = headers
        state.response.data.row_count = row_count
    }

    async function set_console_response_to_empty() {
        state.response = {...default_console_response}
    }

    async function cancel_current_running_query() {
        const _jobs_response = await request_crate(
            Queries.GET_JOB_BY_STMT,
            null,
            {'%stmt': state.content})
        const jobs = await _jobs_response.json()
        const target_job = jobs.rows[0][0]

        const _kill_response = await request_crate(
            Queries.KILL,
            null,
            {'%id': target_job})
        const kill_json_response = await _kill_response.json()

        if (_kill_response.ok) {
            state.is_query_running = false
        } else {
            await set_console_response_to_error(kill_json_response)
        }
    }

    async function query_from_console() {
        current_console.value.is_query_running = true

        const _response = await request_crate(
            current_console.value.content,
            'error_trace=true',
            {},
            true)
        const json_response = await _response.json()

        if (_response.ok) {
            await set_console_response_to_success(
                'success',
                'Success!',
                `QUERY OK, ${json_response.rowcount} record(s) returned in ${(json_response.duration / 1000).toFixed(4)}s`,
                json_response.rows,
                json_response.cols,
                json_response.rowcount
            )
        } else {
            await set_console_response_to_error(
                'error',
                'Error',
                json_response.error.message,
                json_response.error_trace
            )
            state.live_update = false
        }
        current_console.value.is_query_running = false

    }

    if (route.query.query != null) {
        current_console.value.content = route.query.query
    }

    // Syncs the content of the console with the url query, it could have also been done
    // via subscribing the @update event in the console component, but I think
    // it's easier to maintain if every event is on the same place.
    watch(
        () => current_console.value.content, async () => {
            await router.replace({path: route.path, query: {query: current_console.value.content}})
        }
    )

    // Whenever live_update is true, every 5000ms, we re-submit the query this enables
    // our 'live' update feature.
    const LIVE_UPDATE_EVERY_MS = 5000

    watch(
        () => state.live_update, () => {
            if (state.live_update) {
                state._live_update_interval = setInterval(
                    async () => {
                        await query_from_console()
                    }, LIVE_UPDATE_EVERY_MS
                )
            } else {
                clearInterval(state._live_update_interval)
            }
        }
    )

    return {
        ...toRefs(state),
        current_console,
        query_from_console,
        cancel_current_running_query,
        set_console_response_to_empty,
        format_query_content
    }
})
