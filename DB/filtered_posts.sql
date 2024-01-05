
USE zanaathan;

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