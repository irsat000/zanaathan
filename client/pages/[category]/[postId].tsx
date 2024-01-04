
import Router, { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function PostRedirect() {
    const router = useRouter();
    // Get post id to redirect
    const { category, postId } = router.query;

    useEffect(() => {
        if (!category) return
        // Redirect to page with title
        Router.push(`/${category}/${postId}/gonderi`)
    }, [category])

    return (
        <></>
    );
}