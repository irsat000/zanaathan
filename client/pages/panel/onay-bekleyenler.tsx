import React, { useEffect, useState } from "react";
import Image from 'next/image'
import PanelTemplate from "./components/template";
import { apiUrl, postImageLink } from "@/lib/utils/helperUtils";
import { fetchJwt } from "@/lib/utils/userUtils";
import { CaretLeft, CaretRight, ChevronDown } from "react-bootstrap-icons";
import Link from "next/link";


interface ApprovePost {
    Id: number
    Title: string
    Images: string[]
    CategoryCode: string
    ActiveImage: number
    OwnerId: number
}

export default function ApprovingPosts() {

    const [posts, setPosts] = useState<ApprovePost[]>([])

    const [activeRejectMenu, setActiveRejectMenu] = useState<number | null>(null);

    const [selectedBanDuration, setSelectedBanDuration] = useState('0');

    useEffect(() => {
        setSelectedBanDuration('0')
    }, [activeRejectMenu])


    useEffect(() => {
        // Check jwt
        const jwt = fetchJwt()
        if (!jwt) return

        // Fetch posts that are waitin for approval
        fetch(`${apiUrl}/panel/waiting-approval`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + jwt
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                const sanatizePosts = data.posts.map((p: any) => ({
                    ...p,
                    Images: p.Images ? p.Images.split(',') : [],
                    ActiveImage: 0
                }))
                setPosts(sanatizePosts)
            })
            .catch(err => alert('Hata oluştu!'))
    }, [])

    // Swiping carousel functionality
    const handleSwipeImage = (pIndex: number, dir: 'r' | 'l') => {
        const updated = [...posts]
        const post = updated.find(p => p.Id === pIndex)!
        post.ActiveImage = dir === 'r'
            ? (post.ActiveImage + 1) % post.Images.length // If next - right
            : (post.ActiveImage - 1 + post.Images.length) % post.Images.length // If prev - left
        setPosts(updated)
    }

    // Handle clicking outside reject-menu
    useEffect(() => {
        const handleDocumentClick = (e: any) => {
            // Check if the click target is outside of the reject-menu container
            if (activeRejectMenu
                && !e.target.closest('.reject-menu-container')) {
                setActiveRejectMenu(null)
            }
        };

        // Record clicks
        document.addEventListener("click", handleDocumentClick)

        return () => {
            document.removeEventListener("click", handleDocumentClick)
        }
    }, [posts])

    // To approve posts
    const handleApprovePost = (postId: number) => {
        // Check jwt
        const jwt = fetchJwt()
        if (!jwt) return

        fetch(`${apiUrl}/panel/approve-post/${postId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + jwt
            }
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                const updated = posts.filter(p => p.Id !== postId)
                setPosts(updated)
            })
            .catch(err => alert('Hata oluştu!'))
    }

    // To reject posts
    const handleRejectPost = (post: ApprovePost) => {
        // Check jwt
        const jwt = fetchJwt()
        if (!jwt) return


        fetch(`${apiUrl}/panel/reject-post/${post.Id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json; charset=utf-8',
                Authorization: 'Bearer ' + jwt
            },
            body: JSON.stringify({
                banDuration: selectedBanDuration
            })
        })
            .then(res => res.ok ? res.json() : Promise.reject(res))
            .then(data => {
                // If user is not going to be banned, just reject this one
                // Otherwise delete all their post that are waiting for approval
                const updated = posts.filter(p => {
                    return selectedBanDuration === '0' ? p.Id !== post.Id : p.OwnerId !== post.OwnerId
                })
                setPosts(updated)
                if (selectedBanDuration === '0') {
                    alert('Gönderi silindi.')
                } else {
                    alert('Kullanıcıya ait tüm onay bekleyen gönderiler silindi.')
                }
            })
            .catch(err => alert('Hata oluştu!'))
    }

    return (
        <PanelTemplate tabName='Onay bekleyen gönderiler'>
            <div className="approval-listing">
                {posts && posts.length > 0 ?
                    posts.map((p: ApprovePost) =>
                        <div className="post" key={p.Id}>
                            <div className="images">
                                {p.Images.length > 1 ? <>
                                    <button type="button" className="prev-img" onClick={() => handleSwipeImage(p.Id, 'l')}><CaretLeft /></button>
                                    <button type="button" className="next-img" onClick={() => handleSwipeImage(p.Id, 'r')}><CaretRight /></button>
                                    <div className="carousel-nav">
                                        {p.Images.map((img, i) =>
                                            <span className={`dot ${p.ActiveImage === i ? 'active' : ''}`}></span>
                                        )}
                                    </div>
                                </> : <></>}
                                <div className="image-carousel">
                                    {p.Images.map((img, i) =>
                                        <Image
                                            className={`carousel-image ${p.ActiveImage === i ? 'active' : ''}`}
                                            loader={() => postImageLink(img)}
                                            priority={i === 0 ? true : false}
                                            src={postImageLink(img)}
                                            alt={`İlanın ${i + 1}. fotoğrafı`}
                                            width={0}
                                            height={0}
                                            key={i}
                                            onError={() => {
                                                // TODO: Tell the admin this needs to be deleted because an image gave error
                                                // Unlikely to happen
                                                // Can be automatically deleted
                                            }}
                                        />
                                    )}
                                </div>
                            </div>
                            <Link href={`/${p.CategoryCode}/${p.Id}`} className="title">{p.Title}</Link>
                            <div className="actions">
                                <div className="reject-menu-container">
                                    <button type="button" className="reject-menu-button" onClick={() => {
                                        setActiveRejectMenu(activeRejectMenu === p.Id ? null : p.Id)
                                    }}>
                                        Reddet
                                        <ChevronDown />
                                    </button>
                                    <div className={`reject-menu ${activeRejectMenu === p.Id ? 'active' : ''}`}>
                                        <ul>
                                            <li onClick={() => handleRejectPost(p)}>Kaldır</li>
                                            {/* coming soon
                                            <li onClick={() => handleRejectPost(p.Id)}>Müstehcen fotoğraf</li>
                                            <li onClick={() => handleRejectPost(p.Id)}>Küfür</li>
                                            <li onClick={() => handleRejectPost(p.Id)}>Fotoğraf hatalı</li>
                                            <li onClick={() => handleRejectPost(p.Id)}>Diğer</li>*/}
                                        </ul>
                                        <select
                                            name="optional-ban"
                                            value={selectedBanDuration}
                                            onChange={(e) => {
                                                setSelectedBanDuration(e.target.value)
                                            }}
                                        >
                                            <option value="0">Kullanıcıyı Yasakla</option>
                                            <option value="1">1 gün</option>
                                            <option value="7">7 gün</option>
                                            <option value="30">1 ay</option>
                                            <option value="90">3 ay</option>
                                            <option value="9999">Süresiz</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="button" className="accept-button" onClick={() => handleApprovePost(p.Id)}>Kabul et</button>
                            </div>
                        </div>
                    ) :
                    <h2>Bekleyen gönderi yok</h2>}
            </div>
        </PanelTemplate >
    )
}
