import { REPL } from './eval/REPL'

(async () => {
    const repl = new REPL()
    await repl.run()
})()
