import Head from 'next/head'
import { NextPage } from 'next'

const ShowHand: NextPage = () => {
    return (
        <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
            <Head>
                <link rel="icon" href="/assets/gamble-favicon.ico" />
                <link rel="icon" type="image/png" sizes="32x32" href="/assets/gamble-favicon-32x32.png" />
                <link rel="icon" type="image/png" sizes="16x16" href="/assets/gamble-favicon-16x16.png" />
            </Head>
            <h1>Show Hand</h1>
            <p>Working In Progress</p>
        </main>
    )
}

export default ShowHand
