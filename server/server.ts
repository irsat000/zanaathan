const express = require('express');
const schedule = require('node-schedule');
//const https = require('https');
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
const cors = require('cors');
import { Request, Response } from 'express';
import { verifyJwt } from './utils/userUtils';
import { isNullOrEmpty, isPositiveNumeric, rateLimiter, titleToUrl } from './utils/helperUtils';
import { SitemapStream, streamToPromise } from 'sitemap';
import { createGzip } from 'zlib';
import { Readable } from 'stream';

// Configuration
const app = express();
const PORT = 8123;

const httpServer = createServer(app);

// Set env
const environment = process.env.NODE_ENV;

// Web socket
const io = new Server(httpServer, {
    cors: {
        origin: environment === 'development'
            ? [
                'https://localhost:3000',
                'http://localhost:3000',
                'https://192.168.1.106:3000',
                'https://192.168.1.109:3000',
                'https://192.168.1.110:3000',
                'http://192.168.1.110:3000'
            ]
            : ['https://zanaathan.com',
                'http://zanaathan.com']
    }
})

// MIDDLEWARES
app.use(express.json());
app.use(cors({
    origin: environment === 'development'
        ? [
            'https://localhost:3000',
            'http://localhost:3000',
            'https://192.168.1.106:3000',
            'https://192.168.1.109:3000',
            'https://192.168.1.110:3000',
            'http://192.168.1.110:3000'
        ]
        : ['https://zanaathan.com',
            'http://zanaathan.com'],
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}));

// - Routes
const chatRoutes = require('./routes/chatRoutes');
const userRoutes = require('./routes/userRoutes');
const postRoutes = require('./routes/postRoutes');
const imageRoutes = require('./routes/imageRoutes');
const panelRoutes = require('./routes/panelRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
app.use('/api', chatRoutes);
app.use('/api', userRoutes);
app.use('/api', postRoutes);
app.use('/api', imageRoutes);
app.use('/api', panelRoutes);
app.use('/api', notificationRoutes);

// Database pool
const pool = require('./db/db');


/*const socketUserMap: Map<string, number> = new Map();*/
const userSocketMap: Map<number, string> = new Map();

/*setInterval(() => {
    console.log({
        socketUserMap,
        userSocketMap
    })
}, 10000);*/

// Web socket
interface CustomSocket extends Socket {
    userId?: number;
}
io.use((socket: CustomSocket, next) => {
    // Verify JWT token
    const jwt = socket.handshake.auth.token;
    const userId = verifyJwt(jwt);
    if (userId) {
        socket.userId = userId; // Attach to the socket for future use
        userSocketMap.set(userId, socket.id); // Save to map
        next();
    }
    else {
        return next(new Error('Authentication error'));
    }
})
    .on('connection', (socket: CustomSocket) => {
        //console.log(`Client ${socket.id} connected`);

        socket.on('removeNotification', (data: string) => {
            const userId = socket.userId;
            if (!userId) return;
            // Verify and parse
            const parsed = JSON.parse(data);
            if (!parsed.contact) return; // Bad request

            const query = `DELETE FROM mnotification WHERE SenderId = ? AND ReceiverId = ?;`;
            pool.query(query, [parsed.contact, userId], (qErr: any, results: any) => {
                if (qErr) return;
            });
        });

        // Handle the chat message from the client
        socket.on('message', (data: any) => {
            try {
                const userId = socket.userId;
                if (!userId) return;
                // Verify and parse
                const parsed = JSON.parse(data);
                // Check empty
                if (isNullOrEmpty(parsed.content)) return;
                // Check target
                const receiverId: number = parsed.receiver;
                if (!isPositiveNumeric(receiverId) || userId === receiverId) return;

                // Connections that we send real-time messages to
                const connsToSendMessage: string[] = [];
                const target_1 = userSocketMap.get(userId);
                if (target_1) connsToSendMessage.push(target_1);

                // Check block status between two users
                const checkBlockQuery = `
                    SELECT COUNT(*) AS Count FROM user_block
                    WHERE (AccountId = ? AND TargetId = ?)
                    OR (AccountId = ? AND TargetId = ?);
                `;
                pool.query(checkBlockQuery, [userId, receiverId, receiverId, userId], (checkBlockQErr: any, results: any) => {
                    if (checkBlockQErr) {
                        const errorMessage = {
                            status: 'error',
                            message: 'Failed to check block between users.'
                        };
                        // Send error message
                        if (target_1) io.to(target_1).emit('message', JSON.stringify(errorMessage));
                        return;
                    }
                    if (results[0].Count > 0) {
                        // There is a block between users
                        const blockedWarning = {
                            status: 'blocked',
                            message: 'There is a block between two users.'
                        };
                        // Send information
                        if (target_1) io.to(target_1).emit('message', JSON.stringify(blockedWarning));
                    }
                    else {
                        // No block, free to message
                        const target_2 = userSocketMap.get(receiverId);
                        if (target_2) connsToSendMessage.push(target_2);

                        // Create message in db
                        const query = 'INSERT INTO message(Body, CreatedAt, IsDeleted, ReceiverId, SenderId) VALUES(?, NOW(), 0, ?, ?);';
                        pool.query(query, [parsed.content, receiverId, userId], (qErr: any, results: any) => {
                            if (qErr) {
                                const errorMessage = {
                                    status: 'error',
                                    message: 'Failed to insert the message into the database.'
                                };
                                // Send error message
                                if (target_1) io.to(target_1).emit('message', JSON.stringify(errorMessage));
                                return;
                            }

                            // Get message from db
                            const query2 = `
                                SELECT M.Id AS Id, Body, SenderId, M.CreatedAt,
                                    A.Username, A.FullName, A.Avatar
                                FROM message AS M
                                LEFT JOIN account AS A ON A.Id = M.SenderId
                                WHERE M.Id = ?;
                            `;
                            pool.query(query2, [results.insertId], (qErr2: any, results2: any) => {
                                if (qErr2) {
                                    const errorMessage = {
                                        status: 'error',
                                        message: 'Failed to fetch the inserted message.'
                                    };
                                    // Send error message
                                    if (target_1) io.to(target_1).emit('message', JSON.stringify(errorMessage));
                                    return;
                                }

                                // Send message in real-time to associated users only
                                const responseMessage = {
                                    status: 'success',
                                    message: results2[0],
                                    receiverId
                                };
                                connsToSendMessage.forEach((socketId) => {
                                    io.to(socketId).emit('message', JSON.stringify(responseMessage));
                                });

                                // Create only if target_2(receiver) is offline
                                if (!target_2) {
                                    // Create notification and send it to receiver
                                    const query3 = 'INSERT INTO mnotification(ReceiverId, SenderId) VALUES(?, ?);';
                                    pool.query(query3, [receiverId, userId], (qErr3: any, results3: any) => {
                                        if (qErr3) return;
                                    });
                                }
                            });
                        });
                    }
                });
            } catch (error) {
                // Logging
            }
        });

        socket.on('disconnect', () => {
            //console.log('Client disconnected');
            // Delete pairs after disconnect
            const userId = socket.userId;
            if (!userId) return;
            userSocketMap.delete(userId);
        });
    });


// Site map generation
interface PostForLink {
    Id: number
    Title: string
    CategoryCode: string
}
interface SiteMapObj {
    url: string
    changefreq: string
    priority: number
}

let sitemap: Buffer

app.get('/sitemap.xml', rateLimiter({ minute: 10, max: 100 }), (req: Request, res: Response) => {
    res.header('Content-Type', 'application/xml');
    res.header('Content-Encoding', 'gzip');
    // if we have a cached entry send it
    if (sitemap) {
        return res.send(sitemap)
    }

    try {
        const smStream = new SitemapStream({ hostname: 'https://zanaathan.com/' })
        const pipeline = smStream.pipe(createGzip())

        // pipe your entries or directly write them.
        smStream.write({ url: '/', changefreq: 'monthly', priority: 0.3 });

        // Get category list
        const codesQuery = `SELECT Code FROM category;`;
        pool.query(codesQuery, (qErr: any, results: any) => {
            if (qErr) {
                throw qErr
            }

            // Get dynamic urls
            const categoryUrls: SiteMapObj[] = results.map((c: { Code: string }) =>
                ({ url: `/${c.Code}`, changefreq: 'daily', priority: 0.7 }))

            // Get posts for creating urls
            const postsQuery = `
                SELECT JP.Id, SUBSTRING(JP.Title, 1, 71) as Title, category.Code as CategoryCode
                FROM job_posting JP
                LEFT JOIN sub_category ON sub_category.Id = JP.SubCategoryId
                LEFT JOIN category ON category.Id = sub_category.CategoryId
                WHERE CurrentStatusId = 1;
            `;
            pool.query(postsQuery, (qErr: any, results: any) => {
                if (qErr) {
                    throw qErr
                }

                // Get dynamic urls
                const postUrls: SiteMapObj[] = results.map((p: PostForLink) =>
                    ({ url: `/${p.CategoryCode}/${p.Id}/${titleToUrl(p.Title)}`, changefreq: 'daily', priority: 0.7 }))

                // Write dynamic url
                Readable.from([...categoryUrls, ...postUrls]).pipe(smStream)

                streamToPromise(pipeline).then(sm => {
                    // cache the response
                    sitemap = sm
                    // end
                    smStream.end()
                })
                // stream write the response
                pipeline.pipe(res).on('error', (e) => { throw e })
            });
        });
    } catch (e) {
        return res.status(500).end()
    }
})

/*
Daily check for expired posts. The logic;
Get posts with last status update earlier than previous 7 days and waiting answer post status (1)
    -if job_posting_expiration has no data
        +create exp data with "Warning" status
        +create notification data for account id with post id in it
    -if expiration data is earlier than 7 days ago and status is "Warning"
    -if expiration data is earlier than 14 days and status is "GuestPost"
        +change post status to "tamamlandı(completed)"
        +delete the post expiration data
        (optional todo) +create notification saying the post is auto updated
    -if expiration data is earlier than 7 days ago and status is "Extended"
        +update exp data with "Warning" status, repeating the warning in other words 
        +create notification data for account id with post id in it

Note: Last update properties must be updated with NOW() and expiration data must be deleted
    in relevant update functions for this to work without problem (e.g. Post current status updates)

ExpirationStatusId;
1: "Warning"
2: "Extended"
3: "GuestPost"
NotificationTypeId;
1: "postExpiration"
*/
const checkJobPostingExpiration = () => {
    let connection: any;

    try {
        const query = `
            SELECT Id, AccountId FROM job_posting
            WHERE LastStatusUpdate < DATE_SUB(NOW(), INTERVAL 7 DAY)
            AND CurrentStatusId = 1;
        `;
        pool.query(query, (qErr: any, results: { Id: number, AccountId: number | null }[]) => {
            if (qErr) {
                throw qErr;
            }
            //console.log('1')
            // Iterate over all the waiting posts and check if they require action
            results.forEach((post) => {
                //console.log('x')
                const query = `
                    SELECT
                        CASE 
                            WHEN ExpirationStatusId = 3 AND LastUpdate < DATE_SUB(NOW(), INTERVAL 14 DAY) THEN 1
                            WHEN LastUpdate < DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1
                            ELSE 0
                        END AS ActionRequired,
                        ExpirationStatusId AS ExpirationStatusId
                    FROM job_posting_expiration
                    WHERE JobPostingId = ${post.Id}
                    LIMIT 1;
                `;
                pool.query(query, (err: any, results: { ActionRequired: boolean, ExpirationStatusId: number /* 1|2|3 */ }[]) => {
                    if (err) {
                        throw err;
                    }
                    //console.log('2')
                    // Get connection for transaction and rollback
                    pool.getConnection((connErr: any, conn: any) => {
                        if (connErr) throw connErr;
                        // Assign connection
                        connection = conn;
                        connection.beginTransaction(async (err: any) => {
                            if (err) throw err;
                            //console.log('3')

                            if (results.length === 0) {
                                // No expiration status, create one with 1/"Warning" and send a notification
                                let query = `
                                    INSERT INTO job_posting_expiration(ExpirationStatusId, JobPostingId, LastUpdate)
                                    VALUES(1, ${post.Id}, NOW());
                                `;
                                if (post.AccountId) {
                                    query += `
                                        INSERT INTO notification(NotificationTypeId, AccountId, IsSeen, PostId, CreatedAt)
                                        VALUES(1, ${post.AccountId}, 0, ${post.Id}, NOW());
                                    `;
                                }
                                await transactionQueryAsync(query, connection);
                                //console.log('4-1')
                            }
                            else if (results[0].ActionRequired
                                && (results[0].ExpirationStatusId === 1 || results[0].ExpirationStatusId === 3)) {
                                // Status is "Warning", 7 days have passed, the user didn't respond, set to completed
                                // Delete the expiration so that the server doesn't think user didn't respond to non-existent notification
                                // or
                                // Status is "GuestPost", 14 days have passed, this was a guest posting, auto completion was required
                                // Delete the expiration for clean up
                                const query = `
                                    UPDATE job_posting SET CurrentStatusId = 3, LastStatusUpdate = NOW() WHERE Id = ${post.Id};
        
                                    DELETE FROM job_posting_expiration WHERE JobPostingId = ${post.Id};
                                `;
                                await transactionQueryAsync(query, connection);
                                //console.log('4-2')
                            }
                            else if (results[0].ActionRequired && results[0].ExpirationStatusId === 2) {
                                // Status is "Extended", the user wanted 7 more days and it has ended.
                                // Update this status and send notification again
                                let query = `
                                    UPDATE job_posting_expiration
                                    SET ExpirationStatusId = 1, LastUpdate = NOW()
                                    WHERE JobPostingId = ${post.Id};
                                `;
                                if (post.AccountId) {
                                    query += `
                                        INSERT INTO notification(NotificationTypeId, AccountId, IsSeen, PostId, CreatedAt)
                                        VALUES(1, ${post.AccountId}, 0, ${post.Id}, NOW());
                                    `;
                                }
                                await transactionQueryAsync(query, connection);
                                //console.log('4-3')
                            }

                            // COMMIT
                            connection.commit((err: any) => {
                                if (err) {
                                    connection.rollback();
                                    throw err;
                                }
                                connection.release();
                                //console.log('5')
                            });
                        });
                    });
                });
            });
        });
    } catch (error) {
        connection.release();
        console.error("Error in daily expiration check:", error);
    }
}
// Disabled for now
// Daily = 0 0 * * *
/*schedule.scheduleJob('0 0 * * *', () => {
    checkJobPostingExpiration();
});
*/












// Check status
app.get("/", rateLimiter(), (req: Request, res: Response) => {
    res.send('online');
});

app.get("/api/test", rateLimiter(), (req: Request, res: Response) => {
    res.json({ message: "Success" });
});

app.get("/api/dbtest", rateLimiter(), (req: Request, res: Response) => {
    pool.query('SELECT 1 + 1 AS solution', (qErr: any, rows: any, fields: any) => {
        if (qErr) {
            res.status(500).json({ error: 'Server error', qErr });
            return;
        }

        res.json({ message: rows[0].solution });
    });
});


httpServer.listen(PORT, () => {
    console.log(`Server started on port :${PORT}`);
});






function transactionQueryAsync(query: string, conn: any): Promise<any> {
    return new Promise((resolve, reject) => {
        conn.query(query, (error: any, results: any) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}


function queryAsync(query: string): Promise<any> {
    return new Promise((resolve, reject) => {
        pool.query(query, (error: any, results: any) => {
            if (error) {
                reject(error);
            } else {
                resolve(results);
            }
        });
    });
}