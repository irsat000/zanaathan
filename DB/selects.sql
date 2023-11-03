
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




# Get posts with all their images in a column
SELECT
	JP.Id,
	JP.Title,
	TIMESTAMPDIFF(SECOND, JP.CreatedAt, NOW()) AS SecondsAgo,
	JP.Description,
	GROUP_CONCAT(DISTINCT JPI.Body ORDER BY JPI.ImgIndex) AS Images,
    A.Id AS A_Id,
    A.Username AS A_Username,
    A.FullName AS A_FullName,
    A.Avatar AS A_Avatar,
    GROUP_CONCAT(DISTINCT CONCAT(CI.Body, ' / ', CT.Body) ORDER BY CI.Id) AS ContactInfo
FROM JobPosting JP
LEFT JOIN JobPostingImages JPI ON JP.Id = JPI.JobPostingId
LEFT JOIN Account A ON JP.AccountId = A.Id
LEFT JOIN ContactInformation CI ON A.Id = CI.AccountId
LEFT JOIN ContactType CT ON CI.ContactTypeId = CT.Id
WHERE JP.Id = 1
GROUP BY JP.Id;


SELECT * FROM Account;



