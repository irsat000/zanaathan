
import Router, { useRouter } from 'next/router';
import { useEffect } from 'react';

export default function PostRedirect() {
    const router = useRouter();
    // Get post id to redirect
    const { category, postId } = router.query;

    // TODO: Get category from the database by checking it using post id
    // User server side props for checking

    useEffect(() => {
        if (!category) return
        // Redirect to page with title
        Router.push(`/${category}/${postId}/gonderi`)
    }, [category])

    return (
        <></>
    );
}