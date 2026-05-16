```json
// This is a simple ERD for the Tender Track 360 Data Model
Link to the ERD: https://app.eraser.io/workspace/NwZI5JTezUQS3mnS8CaQ?origin=share
// This ERD is created using Eraser.io
// Eraser.io is a collaborative diagramming tool that allows you to create and share diagrams with your team.
// link: https://app.eraser.io/workspace/NwZI5JTezUQS3mnS8CaQ?origin=share
// title
title: Tender Track 360 Data Model

// define tables
users [icon: user, color: yellow]{
  id uuid pk
  email string unique
  full_name string
  role string
  department string
  is_active boolean
  last_login_at timestamp
  profile_image_url string
  created_at timestamp
  updated_at timestamp
}

clients [icon: briefcase, color: blue]{
  id uuid pk
  name string
  type string
  contact_person string
  contact_email string
  contact_phone string
  address text
  website string
  description text
  is_active boolean
  created_by_id uuid
  created_at timestamp
  updated_at timestamp
}

tenders [icon: file-text, color: orange]{
  id uuid pk
  reference_number string
  title string
  description text
  client_id uuid
  status string
  publication_date date
  submission_deadline timestamp
  evaluation_date date
  award_date date
  estimated_value decimal
  actual_value decimal
  is_successful boolean
  department string
  notes text
  created_by_id uuid
  updated_by_id uuid
  created_at timestamp
  updated_at timestamp
}

documents [icon: file, color: green]{
  id uuid pk
  tender_id uuid
  category string
  title string
  file_name string
  file_size integer
  mime_type string
  storage_url string
  version integer
  is_latest_version boolean
  uploaded_by_id uuid
  created_at timestamp
  updated_at timestamp
}

tasks [icon: check-square, color: purple]{
  id uuid pk
  tender_id uuid
  title string
  description text
  assigned_to_id uuid
  due_date timestamp
  is_completed boolean
  completed_at timestamp
  priority integer
  created_by_id uuid
  created_at timestamp
  updated_at timestamp
}

notifications [icon: bell, color: red]{
  id uuid pk
  user_id uuid
  type string
  title string
  message text
  related_entity_id uuid
  is_read boolean
  read_at timestamp
  created_at timestamp
}

activity_logs [icon: activity, color: teal]{
  id uuid pk
  tender_id uuid
  user_id uuid
  action string
  details text
  created_at timestamp
}

custom_fields [icon: tag, color: lightblue]{
  id uuid pk
  name string
  field_type string
  is_required boolean
  created_by_id uuid
  created_at timestamp
  updated_at timestamp
}

custom_field_values [icon: edit, color: pink]{
  id uuid pk
  tender_id uuid
  custom_field_id uuid
  value text
  created_at timestamp
  updated_at timestamp
}

tender_team_members [icon: users, color: brown]{
  id uuid pk
  tender_id uuid
  user_id uuid
  role string
  created_at timestamp
}

// define relationships
clients.created_by_id > users.id
tenders.client_id > clients.id
tenders.created_by_id > users.id
tenders.updated_by_id > users.id
documents.tender_id > tenders.id
documents.uploaded_by_id > users.id
tasks.tender_id > tenders.id
tasks.assigned_to_id > users.id
tasks.created_by_id > users.id
notifications.user_id > users.id
activity_logs.tender_id > tenders.id
activity_logs.user_id > users.id
custom_fields.created_by_id > users.id
custom_field_values.tender_id > tenders.id
custom_field_values.custom_field_id > custom_fields.id
tender_team_members.tender_id > tenders.id
tender_team_members.user_id > users.id

```