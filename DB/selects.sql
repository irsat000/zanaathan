
# Get posts with their first image
SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
(
	SELECT JPI.Body
	FROM JobPostingImages JPI
	WHERE JP.Id = JPI.JobPostingId
	ORDER BY JPI.ImgIndex
    LIMIT 1
) AS FirstImage FROM JobPosting JP;


# Get posts with all their images in a column
SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, JP.CreatedAt, NOW()) AS SecondsAgo,
	GROUP_CONCAT(JPI.Body ORDER BY JPI.ImgIndex) AS Images
FROM JobPosting JP
LEFT JOIN JobPostingImages JPI ON JP.Id = JPI.JobPostingId
GROUP BY JP.Id;



USE ZanaatHan;
# Get detailed single post with all its images in a column
SELECT
	JP.Id,
	JP.Title,
	TIMESTAMPDIFF(SECOND, JP.CreatedAt, NOW()) AS SecondsAgo,
	JP.Description,
	GROUP_CONCAT(DISTINCT JPI.Body ORDER BY JPI.ImgIndex SEPARATOR ';') AS Images,
    A.Id AS A_Id,
    A.Username AS A_Username,
    A.FullName AS A_FullName,
    A.Avatar AS A_Avatar,
    GROUP_CONCAT(DISTINCT CONCAT(CI.Body, ' - ', CT.Body) ORDER BY CI.Id SEPARATOR ';') AS ContactInfo,
    CONCAT(D.Name, ' - ', C.Name) AS Location
FROM JobPosting JP
LEFT JOIN JobPostingImages JPI ON JP.Id = JPI.JobPostingId
LEFT JOIN Account A ON JP.AccountId = A.Id
LEFT JOIN ContactInformation CI ON A.Id = CI.AccountId
LEFT JOIN ContactType CT ON CI.ContactTypeId = CT.Id
LEFT JOIN District D ON JP.DistrictId = D.Id
LEFT JOIN City C ON D.CityId = C.Id
WHERE JP.Id = 1
GROUP BY JP.Id;


SELECT * FROM Account;






USE ZanaatHan;
# Get contacts
SELECT
	A.Id AS ReceiverId,
	A.Username AS ReceiverUsername,
	A.FullName AS ReceiverFullName,
	A.Avatar AS ReceiverAvatar,
	MAX(M.CreatedAt) AS LastMessageDate,
	( SELECT Body
		FROM Message AS M2
		WHERE (M2.SenderId = A.Id OR M2.ReceiverId = A.Id)
			AND M2.CreatedAt = MAX(M.CreatedAt)
	) AS LastMessage
FROM
	Message AS M
JOIN
	Account A ON (M.SenderId = A.Id AND M.ReceiverId = 9)
	OR (M.ReceiverId = A.Id AND M.SenderId = 9)
GROUP BY A.Id
ORDER BY LastMessageDate DESC;


# DEPRECATED
# Without the names of the others
/*SELECT
  Message.Id, Message.CreatedAt, Message.Body, Account.Username AS LastMessagerName
FROM Message
INNER JOIN Account ON Message.AccountId = Account.Id
WHERE ( Message.Id in 
        (SELECT MAX(Message.Id)
         FROM MThreadParticipant AS TP
         INNER JOIN Message ON TP.ThreadId = Message.ThreadId
         WHERE TP.AccountId = 9
         GROUP BY TP.ThreadId)
      )
ORDER BY Message.CreatedAt DESC;*/
# With the receiver's name and avatar
/*SELECT
  DISTINCT Message.ThreadId AS ThreadId,
  Message.CreatedAt AS LastMessageDate,
  Message.Body AS LastMessage,
  Account.Username AS ReceiverUsername,
  Account.FullName AS ReceiverFullName,
  Account.Avatar AS ReceiverAvatar
FROM Message
INNER JOIN MThreadParticipant AS TP1 ON TP1.ThreadId = Message.ThreadId
INNER JOIN Account ON Account.Id = (
	SELECT MAX(A.Id)
    FROM Account A
    INNER JOIN MThreadParticipant TP2 ON A.Id = TP2.AccountId
    WHERE TP2.ThreadId = TP1.ThreadId AND A.Id != 9
)
WHERE (Message.Id IN 
        (SELECT MAX(Message.Id)
         FROM MThreadParticipant AS TP3
         INNER JOIN Message ON TP3.ThreadId = Message.ThreadId
         WHERE TP3.AccountId = 9
         GROUP BY TP3.ThreadId)
      )
ORDER BY LastMessageDate DESC;*/










USE ZanaatHan;
# Get message thread
SELECT M.Id, M.SenderId, M.CreatedAt, M.Body
FROM Message AS M
WHERE (SenderId = 9 AND ReceiverId = 11)
   OR (SenderId = 11 AND ReceiverId = 9)
ORDER BY CreatedAt;

# DEPRECATED
/*SELECT M.Id, M.Body, M.AccountId, M.CreatedAt
FROM Message AS M
INNER JOIN MThread T ON M.ThreadId = T.Id
WHERE M.IsDeleted = 0 AND M.ThreadId = 1
ORDER BY CreatedAt;*/

