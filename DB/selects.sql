
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
	) AS LastMessage,
     CASE WHEN COUNT(UB.TargetId) > 0 THEN true ELSE false END AS IsBlocked
FROM
	Message AS M
JOIN
	Account A ON (M.SenderId = A.Id AND M.ReceiverId = 9)
	OR (M.ReceiverId = A.Id AND M.SenderId = 9)
LEFT JOIN
    UserBlock UB ON A.Id = UB.TargetId AND UB.AccountId = 9
GROUP BY A.Id
ORDER BY LastMessageDate DESC;


USE ZanaatHan;
# Get message thread
SELECT M.Id, M.SenderId, M.CreatedAt, M.Body
FROM Message AS M
WHERE (SenderId = 9 AND ReceiverId = 11)
   OR (SenderId = 11 AND ReceiverId = 9)
ORDER BY CreatedAt;


USE ZanaatHan;
# Get user block
SELECT COUNT(*) AS Count FROM UserBlock
WHERE AccountId = 9 AND TargetId = 11;

SELECT COUNT(*) AS Count FROM UserBlock
WHERE (AccountId = 9 AND TargetId = 11)
OR (AccountId = 11 AND TargetId = 9);

INSERT INTO UserBlock(AccountId, TargetId) VALUES(9, 11);
INSERT INTO UserBlock(AccountId, TargetId) VALUES(11, 9);
DELETE FROM UserBlock WHERE AccountId = 9 AND TargetId = 11;



