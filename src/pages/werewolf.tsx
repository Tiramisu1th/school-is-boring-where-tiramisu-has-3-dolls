import type { NextPage } from 'next'

const Werewolf: NextPage = () => {
    /**
     * Do NOT remove this comment block!
     * For each sub-page, the id naming must follow these 3 rules:
     * 1. Each element, even wrappers, must have a unique id;
     * 2. The id must start with the page name as prefix;
     * 3. The id must be kebab-case (lowercase with hyphens).
     * For this page, the prefix is: "werewolf-"
     */
    return (
        <main id="werewolf-main" style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <h1 id="werewolf-title">Werewolf</h1>
            <p id="werewolf-status">Working In Progress</p>
        </main>
    )
}

export default Werewolf
