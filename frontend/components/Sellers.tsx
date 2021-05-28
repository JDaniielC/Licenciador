import styles from '../styles/components/Sellers.module.css';
import { HeaderContext } from '../contexts/Header.context';
import { useContext, useEffect, useRef, useState } from 'react';
import Head from 'next/head'
import axios from 'axios';
import { serverURL } from '../config';

interface Bot {
    _id: string,
    name: string,
    title: string,
    imageURL: string
}

export interface SellersData {
    data: {
        botlist: []
        email: string;
        password: string;
        type: string;
    }[]
}

export default function Clients({ bots }: { bots: Bot[] }) {
    const { } = useContext(HeaderContext);

    const [sellers, setSellers] = useState({});
    const [email, setEmail] = useState("");
    const [tests, setTests] = useState("");
    const [licenses, setLicenses] = useState("");
    const [showBots, setShowBots] = useState(false);
    const [sellerBots, setSellerBots] = useState([]);

    async function loadSellers() {
        const account = JSON.parse(localStorage.getItem('account'));
        const { data }: SellersData = await axios.get(
            serverURL + "/sellers/", {
            params: { email: account.email }
        });

        const tempSellers = {};
        Object.keys(data).forEach(index => {
            const seller = data[index];
            if (seller.type === "seller") {
                tempSellers[seller.email] = seller;
            }
        });
        setSellers(tempSellers);
    }

    useEffect(() => {
        loadSellers();
    }, [])

    async function saveSeller() {
        function searchSeller(email, data) {
            if (sellers.hasOwnProperty(email)) {
                sellers[email].tests = data.tests;
                sellers[email].licenses = data.licenses;
                sellers[email].botlist = data.botlist;
                sellers[email].show = data.show;
            } else {
                let newSellers = sellers;
                newSellers[email] = data;
                setSellers(newSellers);
            }
        }
        const admin = JSON.parse(localStorage.getItem('account')).email;
    
        const { data } = await axios.post(serverURL + "/sellers/", { 
            email, admin, tests, 
            botlist: sellerBots, 
            show: showBots
        })
        searchSeller(email, data)
        
        setEmail("");
        setTests("");
        setLicenses("");
        setSellerBots([]);
        setShowBots(false);
    }
    
    async function deleteSeller() {
        const admin = JSON.parse(localStorage.getItem('account')).email;
        if (!email) {
            return false;
        }
        await axios.delete(serverURL + "/sellers/", {
            params: { email, creatorEmail: admin }
        }).then(() => {
            setEmail("");
            setTests("");
            loadSellers();
            setSellerBots([]);
            setShowBots(false);
        })
    }
    
    function setSelectedBots(check:boolean, name:string) {
        if (check) {
            setSellerBots([...sellerBots, name]);
        } else {
            setSellerBots(sellerBots.filter((bot) => (bot !== name)));
        }
    }

    function selectSeller(value: string) {
        let bots: [],
            email = "", 
            tests = "",
            licenses: "",
            checked = false
        if (value !== "") {
            email = value
            bots = sellers[value].botlist
            checked = sellers[value].show
            tests = sellers[value].tests
            licenses = sellers[value].licenses
        }
        setTests(tests);
        setEmail(email);
        setSellerBots((bots !== undefined) ? bots : []);
        setShowBots(checked);
        setLicenses(licenses);
    }
    
    return (<>
        <Head>
            <title> Licenciador | Sellers </title>
        </Head>
        <section className ="dashboard">
            <section className = {styles.sellers}>
                <div>
                    <h2> Vendedores cadastrados </h2>
                    <select value = {email}
                        onChange = {({ target }) => {selectSeller(target.value)}}>
                        <option value=""> 
                            Selecionar 
                        </option>
                        {Object.keys(sellers).map((seller) => (
                            <option value={seller} key = {seller}>
                                {seller}
                            </option>
                        ))}
                    </select>
                </div>
                <div> 
                    <h2> Cadastrar novo vendedor </h2>
                    <form>
                        <input type="email" placeholder="E-mail" value = {email}
                            onChange = {({ target }) => {setEmail(target.value)}}/>
                        <input type="number" min = {1} value = {licenses}
                            placeholder = "Quantidade de licenças" disabled/>
                        <input type="number" min = {1} value = {tests}
                            placeholder = "Quantidade de testes"
                            onChange = {({ target }) => {setTests(target.value)}}/>
                        <div className = {styles.showBots}>
                            <label htmlFor = "show"> Mostrar demais bots </label>
                            <input type="checkbox" name="show" checked = {showBots}
                                onChange = {({ target }) => {setShowBots(target.checked)}}/>
                        </div>
                        <button type = "button" onClick = {() => {saveSeller()}}> 
                            Adicionar/Salvar vendedor 
                        </button>
                        <button onClick = {() => {deleteSeller()}} type = "button">
                            Deletar vendedor
                        </button>
                    </form>
                </div>
            </section>

            <section className = {styles.botSelection}>
                {bots?.map((bot) => (
                    <label key = {bot.name} htmlFor = {bot.name}>
                        <input type="checkbox" id = {bot.name}
                            onChange = {({ target }) => setSelectedBots(
                                target.checked, bot.name)}
                            checked = {(sellerBots?.indexOf(bot.name) !== -1)}/>
                        <span>
                            <h3> {bot.title} </h3>
                            <div>
                                <img src = {bot.imageURL} alt = "Bot icon" />
                            </div>
                        </span>
                    </label>
                ))}
            </section>
        </section>
    </>)    
}