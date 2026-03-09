import Link from 'next/link'
import Head from 'next/head'
import { NextPage } from 'next'

const Home: NextPage = () => {
    return (
        <main style={{ padding: 28, fontFamily: 'system-ui, sans-serif' }}>
            <Head>
                <link rel="icon" href="/assets/favicon.ico" />
                <link rel="icon" type="image/png" sizes="32x32" href="/assets/favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/assets/favicon-16x16.png" />
            </Head>
            <h1>School Is Boring — Games (Root)</h1>
            <p>Welcome — select a minigame below.</p>

            <ul>
                <li><Link href="/avalon">Avalon</Link></li>
                <li><Link href="/show-hand">Show Hand</Link></li>
                <li><Link href="/werewolf">Werewolf</Link></li>
            </ul>

            <p style={{ marginTop: 20, color: '#666' }}>All minigames are placeholders showing "Working In Progress".</p>
        </main>
    )
}

export default Home
