user.status
Returns submissions of specified user.

Parameter	Description
handle (Required)	Codeforces user handle.
from	1-based index of the first submission to return.
count	Number of returned submissions.
includeSources	Specifies whether source codes should be included in the output. This option is only available when requested for your own account.
Return value: Returns a list of Submission objects, sorted in decreasing order of submission id.

Example: https://codeforces.com/api/user.status?handle=Fefer_Ivan&from=1&count=10

#Submission Object
Represents a submission.

Field	Description
id	Integer.
contestId	Integer. Can be absent.
creationTimeSeconds	Integer. Time, when submission was created, in unix-format.
relativeTimeSeconds	Integer. Number of seconds, passed after the start of the contest (or a virtual start for virtual parties), before the submission.
problem	Problem object.
author	Party object.
programmingLanguage	String.
verdict	Enum: FAILED, OK, PARTIAL, COMPILATION_ERROR, RUNTIME_ERROR, WRONG_ANSWER, WRONG_ANSWER, TIME_LIMIT_EXCEEDED, MEMORY_LIMIT_EXCEEDED, IDLENESS_LIMIT_EXCEEDED, SECURITY_VIOLATED, CRASHED, INPUT_PREPARATION_CRASHED, CHALLENGED, SKIPPED, TESTING, REJECTED, SUBMITTED. Can be absent.
testset	Enum: SAMPLES, PRETESTS, TESTS, CHALLENGES, TESTS1, ..., TESTS10. Testset used for judging the submission.
passedTestCount	Integer. Number of passed tests.
timeConsumedMillis	Integer. Maximum time in milliseconds, consumed by solution for one test.
memoryConsumedBytes	Integer. Maximum memory in bytes, consumed by solution for one test.
points	Floating point number. Can be absent. Number of scored points for IOI-like contests.
