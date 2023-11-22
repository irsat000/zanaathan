
USE zanaathan;

# Get FILTERED posts with their first image
SELECT JP.Id, JP.Title, TIMESTAMPDIFF(SECOND, CreatedAt, NOW()) AS SecondsAgo,
	(
		SELECT JPI.Body
		FROM JobPostingImages JPI
		WHERE JP.Id = JPI.JobPostingId
		ORDER BY JPI.ImgIndex
		LIMIT 1
	) AS MainImage
FROM JobPosting JP
LEFT JOIN SubCategory ON SubCategory.Id = JP.SubCategoryId
LEFT JOIN District ON District.Id = JP.DistrictId
WHERE SubCategory.CategoryId = ?
	AND JP.SubCategoryId IN (?)
	AND JP.DistrictId = ?
	AND District.CityId = ?
ORDER BY SecondsAgo DESC;