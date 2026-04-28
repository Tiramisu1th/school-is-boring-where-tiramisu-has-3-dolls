import Link from 'next/link'
import Head from 'next/head'
import type { NextPage } from 'next'

const Home: NextPage = () => {
    return (
        <>
            <Head>
                <link rel="icon" href="/favicon.ico" />
            </Head>
            <main style={{ padding: 28, fontFamily: 'system-ui, sans-serif' }}>
                <h1>School Is Boring — Games (Root)</h1>
                <p>Welcome — select a minigame below.</p>

                <ul>
                    <li><Link href="/avalon">Avalon</Link></li>
                    <li><Link href="/show-hand">Show Hand</Link></li>
                    <li><Link href="/werewolf">Werewolf</Link></li>
                </ul>

                <p style={{ marginTop: 20, color: '#666' }}>All minigames are placeholders showing "Working In Progress".</p>
            </main>
        </>
    )
}

export default Home
