import { useEffect, useState } from "react";
import PanelTemplate from "./components/template";
import { Gear, Search } from "react-bootstrap-icons";
import { apiUrl } from "@/lib/utils/helperUtils";
import { fetchJwt } from "@/lib/utils/userUtils";
import PUserEditModal from "./components/pUserEditModal";

export interface PUser {
    Id: number
    Username: string
    FullName: string | null
    Avatar: string | null
    Email: string
    BanLiftDate: string | null
}

export default function UserManagement() {

    // Parameters for searching user
    const [searchProps, setSearchProps] = useState({
        target: '',
        targetType: '0'
    })
    const handleSearchPropsChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setSearchProps({
            ...searchProps,
            [e.target.name]: e.target.value
        })
    }

    // Get users
    const [users, setUsers] = useState<PUser[]>([])

    const handleUserSearch = () => {
        if (searchProps.target.length === 0) {
            alert('Boş aranmaz')
            return;
        }

        // Check jwt
        const jwt = fetchJwt()
        if (!jwt) return

        // Fetch posts that are waitin for approval
        fetch(`${apiUrl}/panel/get-user/${searchProps.target}?targetType=${searchProps.targetType}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + jwt
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                setUsers(data.users)
            })
            .catch(err => alert('Hata oluştu!'))
    }

    // Edited user properties
    const [editedUserId, setEditedUserId] = useState<number | null>(null)

    return (
        <PanelTemplate tabName='Kullanıcı yönetimi'>
            {editedUserId ?
                <PUserEditModal
                    editedUser={users.find(u => u.Id === editedUserId)}
                    setEditedUserId={setEditedUserId}
                    setUsers={setUsers} />
                : <></>}
            <div className="user-listing">
                <div className="search-user">
                    <div className="search-properties">
                        <input type="text" name="target" placeholder="Kullanıcının adını yazınız" value={searchProps.target} onChange={handleSearchPropsChange} />
                        <select name="targetType" value={searchProps.targetType} onChange={handleSearchPropsChange}>
                            <option value="0">Kullanıcı adı</option>
                            <option value="1">Ad Soyad</option>
                            <option value="2">Hesap ID</option>
                        </select>
                    </div>
                    <button type="button" className="search-user-button" onClick={handleUserSearch}>
                        <Search />
                    </button>
                </div>
                <div className="user-listing-table-wrapper">
                    <table border={1}>
                        <thead>
                            <tr>
                                <th className="col-username">Kullanıcı Adı</th>
                                <th className="col-fullName">Ad Soyad</th>
                                <th className="col-settings">İşlem</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) =>
                                <tr key={user.Id}>
                                    <td className="col-username">{user.Username}</td>
                                    <td className="col-fullName">{user.FullName ?? '-'}</td>
                                    <td className="col-settings">
                                        <button type="button" className="user-settings-button" onClick={() => {
                                            setEditedUserId(user.Id)
                                        }}><Gear /></button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </PanelTemplate>
    )
}
