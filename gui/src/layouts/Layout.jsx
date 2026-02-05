import Header from '../components/Header';

export default function Layout({ title, children, headerControls, footer }) {
    return (
        <div className="app">
            <Header title={title}>
                {headerControls}
            </Header>
            <main className="main-area">
                {children}
            </main>
            {footer}
        </div>
    );
}
