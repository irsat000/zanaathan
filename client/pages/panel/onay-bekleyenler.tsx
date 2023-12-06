import { useEffect, useState } from "react";
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
    RejectMenuActive: boolean
}

export default function ApprovingPosts() {

    const [posts, setPosts] = useState<ApprovePost[]>([])

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
                    Images: p.Images.split(','),
                    ActiveImage: 0,
                    RejectMenuActive: false
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

    // Open/Close reject menus
    const toggleRejectMenu = (pIndex: number) => {
        const updated = [...posts]
        updated.map(p => {
            if (p.Id === pIndex) {
                p.RejectMenuActive = !p.RejectMenuActive
            } else {
                p.RejectMenuActive = false
            }
        })
        setPosts(updated)
    }

    // Handle clicking outside reject-menu
    useEffect(() => {
        const handleDocumentClick = (e: any) => {
            // Check if the click target is outside of the reject-menu container
            if (posts.some(p => p.RejectMenuActive)
                && !e.target.closest('.reject-menu-container')) {
                const updated = [...posts]
                updated.map(p => p.RejectMenuActive = false)
                setPosts(updated)
            }
        };

        // Record clicks
        document.addEventListener("click", handleDocumentClick);

        return () => {
            document.removeEventListener("click", handleDocumentClick);
        };
    }, [posts]);

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

    return (
        <PanelTemplate tabName='Onay bekleyen gönderiler'>
            <div className="approval-listing">
                {posts ?
                    posts.map((p: ApprovePost) =>
                        <div className="post">
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
                                                // TODO: Tell admin this needs to be deleted because image gave error
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
                                    <button type="button" className="reject-menu-button" onClick={() => toggleRejectMenu(p.Id)}>
                                        Reddet
                                        <ChevronDown />
                                    </button>
                                    <div className={`reject-menu ${p.RejectMenuActive ? 'active' : ''}`}>
                                        <ul>
                                            <li>Fotoğraf hatalı</li>
                                            <li>Küfür / Müstehcen</li>
                                            <li>Diğer</li>
                                        </ul>
                                        <select name="optional-ban">
                                            <option value="0">Kullanıcıyı Yasakla</option>
                                            <option value="1">1 gün</option>
                                            <option value="7">7 gün</option>
                                            <option value="30">1 ay</option>
                                            <option value="999">Süresiz</option>
                                        </select>
                                    </div>
                                </div>
                                <button type="button" className="accept-button" onClick={() => handleApprovePost(p.Id)}>Kabul et</button>
                            </div>
                        </div>
                    ) : <></>}
            </div>
        </PanelTemplate>
    )
}
