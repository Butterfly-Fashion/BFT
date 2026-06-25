-- Remove the account-level B2B approval gate.
-- Every registered account now gets wholesale pricing and ordering immediately;
-- there is no manual approval step. (Order-level review — order.status 'Approved'
-- before a payment link is sent — is a separate flow and is unaffected.)

alter table profiles alter column is_b2b_approved set default true;

update profiles set is_b2b_approved = true where is_b2b_approved is distinct from true;
