insert into public.products (name, slug, description, sku, barcode, base_price, image_url, category, availability_status, is_bulk_available)
values
('Canada Car Flag', 'canada-car-flag', 'Canada car flag for events, retail counters, and match days.', 'WFG-CF-CAN', '10000001', 9.99, '/asset/images/canada-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Brazil Car Flag', 'brazil-car-flag', 'Brazil car flag for fan zones and event sales.', 'WFG-CF-BRA', '10000002', 9.99, '/asset/images/brazil-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Argentina Car Flag', 'argentina-car-flag', 'Argentina car flag for match-day retail.', 'WFG-CF-ARG', '10000003', 9.99, '/asset/images/argentina-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Japan Flag 3D Embroidered Cap', 'japan-flag-3d-embroidered-cap', 'Japan embroidered cap with raised flag detail.', 'WFG-CAP-JPN', '10000004', 19.99, '/asset/images/japan-flag-3d-embroidered-cap.jpg', 'Caps', 'Available', true),
('Bulgaria Flag 3D Embroidered Cap', 'bulgaria-flag-3d-embroidered-cap', 'Bulgaria embroidered cap for national pride and display.', 'WFG-CAP-BGR', '10000005', 19.99, '/asset/images/bulgaria-flag-3d-embroidered-cap.jpg', 'Caps', 'Available', true),
('France Car Flag', 'france-car-flag', 'France car flag for fan events.', 'WFG-CF-FRA', '10000006', 9.99, '/asset/images/france-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Germany Car Flag', 'germany-car-flag', 'Germany car flag for tournament weekends.', 'WFG-CF-DEU', '10000007', 9.99, '/asset/images/germany-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Ghana Car Flag', 'ghana-car-flag', 'Ghana car flag for community events.', 'WFG-CF-GHA', '10000008', 9.99, '/asset/images/ghana-car-flag.jpg', 'Car Flags', 'Limited', true),
('Italy Car Flag', 'italy-car-flag', 'Italy car flag for storefront displays.', 'WFG-CF-ITA', '10000009', 9.99, '/asset/images/italy-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Mexico Car Flag', 'mexico-car-flag', 'Mexico car flag for event retail.', 'WFG-CF-MEX', '10000010', 9.99, '/asset/images/mexico-car-flag.jpg', 'Car Flags', 'Limited', true),
('Morocco Car Flag', 'morocco-car-flag', 'Morocco car flag for match days.', 'WFG-CF-MAR', '10000011', 9.99, '/asset/images/morocco-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Nigeria Car Flag', 'nigeria-car-flag', 'Nigeria car flag for fan zones.', 'WFG-CF-NGA', '10000012', 9.99, '/asset/images/nigeria-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Portugal Car Flag', 'portugal-car-flag', 'Portugal car flag for sports events.', 'WFG-CF-PRT', '10000013', 9.99, '/asset/images/portugal-car-flag.jpg', 'Car Flags', 'Available', true),
('South Korea Car Flag', 'south-korea-car-flag', 'South Korea car flag for retail and events.', 'WFG-CF-KOR', '10000014', 9.99, '/asset/images/south-korea-car-flag.jpg', 'Car Flags', 'Available', true),
('Spain Car Flag', 'spain-car-flag', 'Spain car flag for match-day customers.', 'WFG-CF-ESP', '10000015', 9.99, '/asset/images/spain-car-flag.jpg', 'Car Flags', 'Available', true),
('Turkey Car Flag', 'turkey-car-flag', 'Turkey car flag for community events.', 'WFG-CF-TUR', '10000016', 9.99, '/asset/images/turkey-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('Ukraine Car Flag', 'ukraine-car-flag', 'Ukraine car flag for display and retail.', 'WFG-CF-UKR', '10000017', 9.99, '/asset/images/ukraine-car-flag.jpg', 'Car Flags', 'Manual Confirm', true),
('United States Car Flag', 'united-states-car-flag', 'United States car flag for fan events.', 'WFG-CF-USA', '10000018', 9.99, '/asset/images/united-states-car-flag.jpg', 'Car Flags', 'Available', true),
('Netherlands Embroidered Cap', 'netherlands-flag-3d-embroidered-cap', 'Netherlands flag cap for event retail.', 'WFG-CAP-NLD', '10000019', 19.99, '/asset/images/netherlands-flag-3d-embroidered-cap.jpg', 'Caps', 'Manual Confirm', true),
('Morocco Embroidered Cap', 'morocco-flag-3d-embroidered-cap', 'Morocco flag cap for national pride.', 'WFG-CAP-MAR', '10000020', 19.99, '/asset/images/morocco-flag-3d-embroidered-cap.jpg', 'Caps', 'Manual Confirm', true)
on conflict (slug) do nothing;

