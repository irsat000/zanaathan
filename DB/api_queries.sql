
# Get user for auth in default way
SELECT Id, Username, FullName, Email, Avatar, Password FROM Account WHERE Username = '' AND OAuthProviderId IS NULL;

# Check existing when sign up
SELECT * FROM Account WHERE Username = ? OR (Email = ? AND IsEmailValid = 1);

# Sign up normally
INSERT INTO Account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
VALUES (?, ?, ?, ?, ?, NULL, NULL, NULL);

# Check existing external account (OAUTH)
SELECT Id, Username, FullName, Email FROM Account WHERE ExternalId = ? && OAuthProviderId = 0;

# Oauth with roles
SELECT Id, Username, FullName, Email, Avatar,
	GROUP_CONCAT(Role.RoleCode) AS Roles
FROM Account
LEFT JOIN account_role ON account_role.AccountId = A.Id
LEFT JOIN Role ON Role.Id = account_role.RoleId
WHERE ExternalId = ? AND OAuthProviderId = 0;

# Signup with external account
INSERT INTO Account (Username, FullName, Email, IsEmailValid, Password, Avatar, ExternalId, OAuthProviderId)
VALUES (?, ?, ?, ?, NULL, ?, ?, ?);


USE ZanaatHan;
# PROFILE SETTINGS
# For comparing
SELECT FullName, Email, Password FROM Account WHERE Id = ?;
# For updating
UPDATE Account SET FullName = ?, Email = ?, Password = ? WHERE Id = ?;
# For creating jwt
SELECT Id, Username, FullName, Email, Avatar FROM Account WHERE Id = ?;

# PROFILE
# Get posts owned by a user
SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
	(
		SELECT JPI.Body
		FROM job_posting_images JPI
		WHERE JP.Id = JPI.JobPostingId
		ORDER BY JPI.ImgIndex
		LIMIT 1
	) AS MainImage,
	JP.CurrentStatusId,
	C.Code AS CategoryCode
FROM job_posting JP
LEFT JOIN sub_category SC ON SC.Id = JP.SubCategoryId
LEFT JOIN Category C ON C.Id = SC.CategoryId
WHERE JP.CurrentStatusId != 4 AND AccountId = ?
ORDER BY SecondsAgo DESC;

# To let the user change their posts' current status
UPDATE job_posting 
SET CurrentStatusId = ? 
WHERE AccountId = ? AND Id = ?;

# Get contact information of a user
SELECT CI.Body AS Body, CI.ContactTypeId AS Type
FROM contact_information CI
WHERE CI.AccountId = ?;





# CATEGORY
# Get FILTERED posts with their first image
SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
	(
		SELECT JPI.Body
		FROM job_posting_images JPI
		WHERE JP.Id = JPI.JobPostingId
		ORDER BY JPI.ImgIndex
		LIMIT 1
	) AS MainImage
FROM job_posting JP
LEFT JOIN sub_category ON sub_category.Id = JP.SubCategoryId
LEFT JOIN District ON District.Id = JP.DistrictId
WHERE sub_category.CategoryId = ?
	AND JP.SubCategoryId IN (?)
	AND JP.DistrictId = ?
	AND District.CityId = ?
ORDER BY SecondsAgo DESC;

# Get posts with their first image
SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
(
	SELECT JPI.Body
	FROM job_posting_images JPI
	WHERE JP.Id = JPI.JobPostingId
	ORDER BY JPI.ImgIndex
    LIMIT 1
) AS FirstImage FROM job_posting JP;


# Get posts with all their images in a column
SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, JP.CreatedAt, NOW()) AS SecondsAgo,
	GROUP_CONCAT(JPI.Body ORDER BY JPI.ImgIndex) AS Images
FROM job_posting JP
LEFT JOIN job_posting_images JPI ON JP.Id = JPI.JobPostingId
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
	CONCAT(D.Name, ' - ', C.Name) AS Location,
	SUM(CASE WHEN Ban.LiftDate > NOW() THEN 1 ELSE 0 END) AS Bans,
    MAX(CASE WHEN Ban.LiftDate > NOW() THEN Ban.LiftDate ELSE NULL END) AS BanLiftDate
FROM job_posting JP
LEFT JOIN job_posting_images JPI ON JP.Id = JPI.JobPostingId
LEFT JOIN Account A ON JP.AccountId = A.Id
LEFT JOIN user_bans Ban ON Ban.AccountId = A.Id
LEFT JOIN contact_information CI ON A.Id = CI.AccountId
LEFT JOIN contact_type CT ON CI.ContactTypeId = CT.Id
LEFT JOIN District D ON JP.DistrictId = D.Id
LEFT JOIN City C ON D.CityId = C.Id
WHERE JP.Id = ?
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
     CASE WHEN COUNT(UB.TargetId) > 0 THEN true ELSE false END AS IsBlocked,
	( SELECT COUNT(*)
		FROM MNotification AS MN
		WHERE MN.SenderId = A.Id AND MN.ReceiverId = 9
	) AS NotificationCount
FROM
	Message AS M
JOIN
	Account A ON (M.SenderId = A.Id AND M.ReceiverId = 9)
	OR (M.ReceiverId = A.Id AND M.SenderId = 9)
LEFT JOIN
    user_block UB ON A.Id = UB.TargetId AND UB.AccountId = 9
GROUP BY A.Id
ORDER BY LastMessageDate DESC;

# Delete notification
DELETE FROM MNotification WHERE SenderId = ? AND ReceiverId = ?;



USE ZanaatHan;
# Get message thread
SELECT M.Id, M.SenderId, M.CreatedAt, M.Body
FROM Message AS M
WHERE (SenderId = 9 AND ReceiverId = 11)
   OR (SenderId = 11 AND ReceiverId = 9)
ORDER BY CreatedAt;


USE ZanaatHan;
# Get user block
SELECT COUNT(*) AS Count FROM user_block
WHERE AccountId = 9 AND TargetId = 11;

SELECT COUNT(*) AS Count FROM user_block
WHERE (AccountId = 9 AND TargetId = 11)
OR (AccountId = 11 AND TargetId = 9);

INSERT INTO user_block(AccountId, TargetId) VALUES(9, 11);
INSERT INTO user_block(AccountId, TargetId) VALUES(11, 9);
DELETE FROM user_block WHERE AccountId = 9 AND TargetId = 11;



