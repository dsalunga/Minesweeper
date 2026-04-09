import viteLogo from "/vite.svg";
import reactLogo from "../assets/react.svg";

const Starter = () => {
    return (
        <div>
            <div>
                <a href="https://vitejs.dev" target="_blank">
                    <img src={viteLogo} className="logo" alt="Vite logo"/>
                </a>
                <a href="https://react.dev" target="_blank">
                    <img src={reactLogo} className="logo react" alt="React logo"/>
                </a>
            </div>
        </div>
    );
}

export default Starter;