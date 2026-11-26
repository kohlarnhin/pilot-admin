import type source from '../zh-CN/exampleApproval';
import type { LocalizedDictionary } from '../../types';

export default {
  "description": "Request details, step progress and approval history · stateless demo",
  "demoHint": "Stateless demo: decisions stay on this page only and refreshing restores the initial data.",
  "listLabel": "Approval requests",
  "pendingCount": "{count} pending",
  "readOnly": "This account can only view approvals",
  "readOnlyHint": "Approving requires the example:update permission.",
  "fields": {
    "applicant": "Applicant",
    "department": "Department",
    "amount": "Amount",
    "submittedAt": "Submitted",
    "currentNode": "Current step",
    "reason": "Reason",
    "items": "Cost breakdown",
    "total": "Total"
  },
  "type": {
    "purchase": "Purchase",
    "travel": "Travel expense",
    "subscription": "Software renewal",
    "event": "Event budget"
  },
  "status": {
    "pending": "In review",
    "approved": "Approved",
    "rejected": "Rejected"
  },
  "node": {
    "submit": "Submitted",
    "manager": "Department lead",
    "finance": "Finance review",
    "done": "Done"
  },
  "step": {
    "done": "Completed",
    "current": "In progress",
    "rejected": "Rejected",
    "waiting": "Not started"
  },
  "stepsLabel": "Approval progress",
  "history": "Approval history",
  "noComment": "No comment",
  "action": {
    "submit": "submitted the request",
    "approve": "Approved",
    "reject": "Rejected",
    "resubmit": "Resubmitted"
  },
  "decide": {
    "approve": "Approve",
    "reject": "Reject",
    "resubmit": "Resubmit",
    "approveTitle": "Approve the {node} step",
    "rejectTitle": "Reject request",
    "resubmitTitle": "Resubmit request",
    "approveHint": "Add an optional comment. Approving moves the request to the next step.",
    "rejectHint": "Explain why. The applicant will see this comment.",
    "resubmitHint": "Describe what changed. The request returns to the department lead.",
    "comment": "Comment",
    "commentPlaceholder": "Add a comment",
    "approved": "Approved the {node} step",
    "rejected": "Request rejected",
    "resubmitted": "Request resubmitted"
  },
  "validation": {
    "commentRequired": "Write at least 5 characters",
    "commentTooLong": "Use 200 characters or fewer"
  },
  "errors": {
    "load": "Couldn't load approvals",
    "stale": "The request changed. Refresh and try again.",
    "decide": "Couldn't complete the action. Try again."
  },
  "seed": {
    "r1": {
      "title": "Monitors for the design team",
      "applicant": "Muyang Zhou",
      "department": "Design",
      "reason": "Three designers are joining. They need colour-accurate 27-inch monitors for daily design and review work.",
      "item1": "27-inch monitor × 4",
      "item2": "Monitor arm × 4"
    },
    "r2": {
      "title": "Client visit to Shanghai",
      "applicant": "Shuyao Zhao",
      "department": "Sales",
      "reason": "Mid-November trip to Shanghai to visit two key clients and move annual renewals forward.",
      "item1": "Return train tickets",
      "item2": "Hotel, 2 nights",
      "item3": "Local transport"
    },
    "r3": {
      "title": "Collaboration suite renewal",
      "applicant": "Anran Xu",
      "department": "Engineering",
      "reason": "The current subscription ends in December. Renew 20 seats for one year.",
      "item1": "Collaboration suite, 20 seats × 12 months"
    },
    "r4": {
      "title": "Year-end team event",
      "applicant": "Zhixia Sun",
      "department": "Operations",
      "reason": "Company-wide year-end event covering venue, catering and transport.",
      "item1": "Venue",
      "item2": "Catering",
      "item3": "Coach hire"
    },
    "managerApprove": "Reasonable request. Approved.",
    "travelApprove": "Itinerary confirmed. Approved.",
    "financeApprove": "Within budget; invoices checked.",
    "rejectBudget": "This exceeds the team's quarterly budget. Reduce catering and resubmit.",
    "manager": "Siyuan Chen",
    "finance": "Qinghe Xu"
  }
} satisfies LocalizedDictionary<typeof source>;
