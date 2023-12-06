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
                const sanatizePosts = data.posts.map((p: any) => ({ ...p, Images: p.Images.split(','), ActiveImage: 0 }))
                setPosts(sanatizePosts)
            })
            .catch(err => alert('Hata oluştu!'))
    }, [])

    const handleSwipeImage = (pIndex: number, dir: 'r' | 'l') => {
        const updated = [...posts]
        const post = updated.find(p => p.Id === pIndex)!
        post.ActiveImage = dir === 'r'
            ? (post.ActiveImage + 1) % post.Images.length
            : (post.ActiveImage - 1 + post.Images.length) % post.Images.length
        setPosts(updated)
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
                                <button type="button" className="reject-menu-button">
                                    Reddet
                                    <ChevronDown />
                                </button>
                                <button type="button" className="accept-button" onClick={() => { }}>Kabul et</button>
                            </div>
                        </div>
                    ) : <></>}
            </div>
        </PanelTemplate>
    )
}
