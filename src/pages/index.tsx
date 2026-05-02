import Link from 'next/link'
import Head from 'next/head'
import type { NextPage } from 'next'


const Home: NextPage = () => {
    /**
     * Do NOT remove this comment block!
     * For the landing page, the id naming must follow these 3 rules:
     * 1. Each element, even wrappers, must have a unique id;
     * 2. The id must avoid using the same prefix as any of the sub-pages;
     * 3. The id must be kebab-case (lowercase with hyphens)
     * Prefixes to avoid: "avalon-", "show-hand-", "werewolf-", "health-"
     */
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main id="root-main" style={{ padding: 28, fontFamily: 'system-ui, sans-serif' }}>
                <h1 id="title">School Is Boring — Games (Root)</h1>
                <p id="subtitle">Welcome — select a minigame below.</p>

                <ul id="games-list">
                    <li><Link id="link-avalon" href="/avalon">Avalon</Link></li>
                    <li><Link id="link-show-hand" href="/show-hand">Show Hand</Link></li>
                    <li><Link id="link-werewolf" href="/werewolf">Werewolf</Link></li>
                </ul>

                <p id="footer-note" style={{ marginTop: 20, color: '#666' }}>All minigames are placeholders showing "Working In Progress".</p>
            </main>
        </>
    )
}

export default Home
