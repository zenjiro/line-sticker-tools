import Header from '../components/Header';

export default function Layout({ title, children, headerControls }) {
    return (
        <div className="app">
            <Header title={title}>
                {headerControls}
            </Header>
            <main className="main-area">
                {children}
            </main>
        </div>
    );
}
